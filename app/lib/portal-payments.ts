import "server-only";
import { randomUUID } from "crypto";
import { Prisma, type MercadoPagoOrderStatus } from "@prisma/client";
import { getCanonicalPlanById } from "./billing/plan-catalog";
import { prisma } from "./prisma";
import { formatMonthlyValue } from "./portal-users";
import { buildMercadoPagoExternalReference } from "./mercadopago/order-policy";

export type PortalPaymentStatusUi = "pago" | "pendente" | "cancelado" | "reembolsado";

export type PortalPaymentRow = {
  id: string;
  provider: "mercadopago" | "admin" | "hotmart";
  providerLabel: string;
  planId: string;
  planLabel: string;
  amount: number;
  amountLabel: string;
  currency: string;
  status: MercadoPagoOrderStatus | string;
  statusUi: PortalPaymentStatusUi;
  statusLabel: string;
  rawStatus: string | null;
  paymentId: string | null;
  externalReference: string | null;
  createdAt: string;
  approvedAt: string | null;
  updatedAt: string;
  canDismiss: boolean;
  canRetry: boolean;
};

export const ADMIN_BILLING_PROVIDER = "admin" as const;

function mapMercadoPagoStatus(status: MercadoPagoOrderStatus): {
  statusUi: PortalPaymentStatusUi;
  statusLabel: string;
} {
  switch (status) {
    case "APPROVED":
      return { statusUi: "pago", statusLabel: "Pago" };
    case "PENDING":
      return { statusUi: "pendente", statusLabel: "Pendente" };
    case "REFUNDED":
      return { statusUi: "reembolsado", statusLabel: "Reembolsado" };
    case "CANCELLED":
    case "REJECTED":
      return { statusUi: "cancelado", statusLabel: "Cancelado" };
    default:
      return { statusUi: "pendente", statusLabel: status };
  }
}

function providerLabel(provider: string) {
  if (provider === ADMIN_BILLING_PROVIDER) return "Ajuste manual (admin)";
  if (provider === "hotmart") return "Hotmart";
  return "Pagamento online";
}

export async function listPortalPaymentsForUser(portalUserId: number): Promise<{
  payments: PortalPaymentRow[];
  totals: {
    paidCount: number;
    pendingCount: number;
    cancelledCount: number;
    refundedCount: number;
  };
}> {
  const orders = await prisma.mercadoPagoOrder.findMany({
    where: { portalUserId },
    orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const payments: PortalPaymentRow[] = orders.map((order) => {
    const plan = getCanonicalPlanById(order.planId, { includeInactive: true });
    const mapped = mapMercadoPagoStatus(order.status);
    const amount = Number(order.amount);
    const isPending = order.status === "PENDING";
    const isOnlineCheckout = order.provider !== ADMIN_BILLING_PROVIDER;
    return {
      id: order.id,
      provider:
        order.provider === ADMIN_BILLING_PROVIDER
          ? "admin"
          : order.provider === "hotmart"
            ? "hotmart"
            : "mercadopago",
      providerLabel: providerLabel(order.provider),
      planId: order.planId,
      planLabel:
        order.provider === ADMIN_BILLING_PROVIDER
          ? order.rawStatus === "admin_vip_cancelled"
            ? "VIP cancelado pelo admin"
            : plan?.title ?? "VIP ativado pelo admin"
          : (plan?.title ?? order.planId),
      amount,
      amountLabel: formatMonthlyValue(amount),
      currency: order.currency,
      status: order.status,
      statusUi: mapped.statusUi,
      statusLabel: mapped.statusLabel,
      rawStatus: order.rawStatus,
      paymentId: order.mercadoPagoPaymentId,
      externalReference: order.externalReference,
      createdAt: order.createdAt.toISOString(),
      approvedAt: order.approvedAt?.toISOString() ?? null,
      updatedAt: order.updatedAt.toISOString(),
      canDismiss: isPending && isOnlineCheckout,
      canRetry: isPending && isOnlineCheckout && Boolean(order.planId),
    };
  });

  return {
    payments,
    totals: {
      paidCount: payments.filter((p) => p.statusUi === "pago").length,
      pendingCount: payments.filter((p) => p.statusUi === "pendente").length,
      cancelledCount: payments.filter((p) => p.statusUi === "cancelado").length,
      refundedCount: payments.filter((p) => p.statusUi === "reembolsado").length,
    },
  };
}

/** Usuário remove pedido pendente do histórico (cancela no banco). */
export async function dismissPendingPortalPayment(portalUserId: number, orderId: string) {
  const order = await prisma.mercadoPagoOrder.findFirst({
    where: {
      id: orderId,
      portalUserId,
      status: "PENDING",
      provider: { not: ADMIN_BILLING_PROVIDER },
    },
  });
  if (!order) {
    return { ok: false as const, error: "Pedido pendente não encontrado.", code: "not_found" };
  }

  await prisma.mercadoPagoOrder.update({
    where: { id: order.id },
    data: {
      status: "CANCELLED",
      rawStatus: "dismissed_by_user",
    },
  });

  return { ok: true as const };
}

/** Registra ativação/cancelamento manual do admin no financeiro do portal. */
export async function recordAdminVipBillingEvent(input: {
  portalUserId: number;
  kind: "activated" | "cancelled";
  amountBrl: number;
  planId?: string | null;
  dueAt?: Date | null;
}) {
  const id = randomUUID();
  const amount = Number.isFinite(input.amountBrl) ? Math.max(0, input.amountBrl) : 0;
  const planId = input.planId?.trim() || "brs-drive-1m";

  return prisma.mercadoPagoOrder.create({
    data: {
      id,
      portalUserId: input.portalUserId,
      planId,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      currency: "BRL",
      status: input.kind === "activated" ? "APPROVED" : "CANCELLED",
      provider: ADMIN_BILLING_PROVIDER,
      externalReference: buildMercadoPagoExternalReference(`admin_${id}`),
      rawStatus: input.kind === "activated" ? "admin_vip_activated" : "admin_vip_cancelled",
      approvedAt: input.kind === "activated" ? new Date() : null,
      payerEmail: null,
    },
  });
}
