import "server-only";
import { randomUUID } from "crypto";
import { Prisma, type MercadoPagoOrder, type MercadoPagoOrderStatus } from "@prisma/client";
import { prisma } from "../prisma";
import {
  buildMercadoPagoExternalReference,
  decideMercadoPagoPaymentUpdate,
  MERCADO_PAGO_CURRENCY,
  MERCADO_PAGO_PROVIDER,
} from "./order-policy";

export type CreatePendingMercadoPagoOrderInput = {
  portalUserId: number;
  planId: string;
  /** Valor em reais (ex.: 38 ou "38.00"). Convertido para Decimal — nunca float binário no banco. */
  amount: Prisma.Decimal | string | number;
  payerEmail?: string | null;
  mercadoPagoPreferenceId?: string | null;
};

export type UpdateMercadoPagoPaymentInput = {
  externalReference: string;
  mercadoPagoPaymentId: string;
  status: MercadoPagoOrderStatus;
  rawStatus?: string | null;
  payerEmail?: string | null;
  mercadoPagoPreferenceId?: string | null;
  approvedAt?: Date | null;
};

export type IdempotentPaymentUpdateResult =
  | { ok: true; applied: true; order: MercadoPagoOrder }
  | { ok: true; applied: false; reason: "duplicate" | "unchanged" | "conflict"; order: MercadoPagoOrder }
  | { ok: false; reason: "not_found" | "payment_taken" };

function toDecimalAmount(amount: Prisma.Decimal | string | number): Prisma.Decimal {
  if (amount instanceof Prisma.Decimal) return amount;
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) {
      throw new Error("Valor do pedido inválido.");
    }
    return new Prisma.Decimal(amount.toFixed(2));
  }
  const normalized = amount.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Valor do pedido inválido.");
  }
  return new Prisma.Decimal(normalized);
}

export async function createPendingMercadoPagoOrder(
  input: CreatePendingMercadoPagoOrderInput,
): Promise<MercadoPagoOrder> {
  const id = randomUUID();
  const externalReference = buildMercadoPagoExternalReference(id);
  const amount = toDecimalAmount(input.amount);

  return prisma.mercadoPagoOrder.create({
    data: {
      id,
      portalUserId: input.portalUserId,
      planId: input.planId,
      amount,
      currency: MERCADO_PAGO_CURRENCY,
      status: "PENDING",
      provider: MERCADO_PAGO_PROVIDER,
      externalReference,
      payerEmail: input.payerEmail?.trim().toLowerCase() || null,
      mercadoPagoPreferenceId: input.mercadoPagoPreferenceId?.trim() || null,
    },
  });
}

export async function attachMercadoPagoPreferenceId(orderId: string, preferenceId: string) {
  const id = preferenceId.trim();
  if (!id) {
    throw new Error("preferenceId é obrigatório.");
  }
  return prisma.mercadoPagoOrder.update({
    where: { id: orderId },
    data: { mercadoPagoPreferenceId: id },
  });
}

/** Marca tentativa cancelada quando a Preference falha após o pedido PENDING. */
export async function markMercadoPagoOrderPreferenceFailed(orderId: string) {
  return prisma.mercadoPagoOrder.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      rawStatus: "preference_create_failed",
    },
  });
}

export async function findMercadoPagoOrderByExternalReference(externalReference: string) {
  return prisma.mercadoPagoOrder.findUnique({
    where: { externalReference },
  });
}

export async function findMercadoPagoOrderByPaymentId(mercadoPagoPaymentId: string) {
  return prisma.mercadoPagoOrder.findUnique({
    where: { mercadoPagoPaymentId },
  });
}

/**
 * Atualiza status/pagamento de forma idempotente.
 * O mesmo `mercado_pago_payment_id` não é processado duas vezes no mesmo estado terminal.
 */
export async function updateMercadoPagoPaymentIdempotent(
  input: UpdateMercadoPagoPaymentInput,
): Promise<IdempotentPaymentUpdateResult> {
  const paymentId = input.mercadoPagoPaymentId.trim();
  if (!paymentId) {
    throw new Error("mercadoPagoPaymentId é obrigatório.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.mercadoPagoOrder.findUnique({
      where: { externalReference: input.externalReference },
    });

    if (!existing) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const taken = await tx.mercadoPagoOrder.findFirst({
      where: {
        mercadoPagoPaymentId: paymentId,
        NOT: { id: existing.id },
      },
      select: { id: true },
    });
    if (taken) {
      return { ok: false as const, reason: "payment_taken" as const };
    }

    const decision = decideMercadoPagoPaymentUpdate(existing, {
      mercadoPagoPaymentId: paymentId,
      status: input.status,
    });

    if (!decision.apply) {
      return {
        ok: true as const,
        applied: false as const,
        reason: decision.reason,
        order: existing,
      };
    }

    const approvedAt =
      input.status === "APPROVED"
        ? (input.approvedAt ?? existing.approvedAt ?? new Date())
        : existing.approvedAt;

    const order = await tx.mercadoPagoOrder.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        mercadoPagoPaymentId: paymentId,
        rawStatus: input.rawStatus?.trim() || existing.rawStatus,
        payerEmail: input.payerEmail?.trim().toLowerCase() || existing.payerEmail,
        mercadoPagoPreferenceId:
          input.mercadoPagoPreferenceId?.trim() || existing.mercadoPagoPreferenceId,
        approvedAt,
      },
    });

    return { ok: true as const, applied: true as const, order };
  });
}
