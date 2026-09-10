import type { MercadoPagoOrderStatus } from "@prisma/client";
import { getSaoPauloDateParts } from "../due-queue";
import {
  decideMercadoPagoPaymentUpdate,
  isTerminalMercadoPagoStatus,
  MERCADO_PAGO_CURRENCY,
} from "./order-policy";

export type WebhookMercadoPagoMode = "test" | "production";

export type MercadoPagoPaymentSnapshot = {
  id: string;
  status: string;
  statusDetail?: string | null;
  transactionAmount: number;
  currencyId: string;
  liveMode: boolean;
  externalReference: string | null;
  preferenceId?: string | null;
  collectorId?: number | null;
  payerEmail?: string | null;
  metadataPlanId?: string | null;
  dateApproved?: string | null;
};

export type OrderForPaymentValidation = {
  id: string;
  portalUserId: number;
  planId: string;
  amount: { toFixed: (digits: number) => string } | string | number;
  currency: string;
  status: MercadoPagoOrderStatus;
  mercadoPagoPaymentId: string | null;
  mercadoPagoPreferenceId: string | null;
  externalReference: string;
};

function dateAtUtcNoon(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/** Soma dias no calendário de São Paulo (vencimento do portal). */
export function addDaysSaoPaulo(from: Date, days: number): Date {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error("Duração inválida.");
  }
  const { year, month, day } = getSaoPauloDateParts(from);
  const base = dateAtUtcNoon(year, month, day);
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}

/** Soma meses no calendário de São Paulo (vencimento do portal). */
export function addMonthsSaoPaulo(from: Date, months: number): Date {
  if (!Number.isInteger(months) || months < 1) {
    throw new Error("Duração inválida.");
  }
  const { year, month, day } = getSaoPauloDateParts(from);
  const total = month + months;
  const nextYear = year + Math.floor((total - 1) / 12);
  const nextMonth = ((total - 1) % 12) + 1;
  const lastDay = new Date(nextYear, nextMonth, 0).getDate();
  return dateAtUtcNoon(nextYear, nextMonth, Math.min(day, lastDay));
}

export function userHasActiveVipAccess(input: {
  servicePoolsVip: boolean;
  nextDueAt: Date;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  return input.servicePoolsVip && input.nextDueAt.getTime() > now.getTime();
}

/**
 * Se não tem acesso ativo: conta a partir da aprovação.
 * Se tem acesso ativo: estende a partir do vencimento atual.
 * Prefere durationDays (planos diários/teste); senão usa durationMonths.
 */
export function computeVipAccessPeriodEnd(input: {
  now: Date;
  durationDays?: number;
  durationMonths?: number;
  hasActiveAccess: boolean;
  currentExpiresAt: Date | null;
}): Date {
  const base =
    input.hasActiveAccess &&
    input.currentExpiresAt &&
    input.currentExpiresAt.getTime() > input.now.getTime()
      ? input.currentExpiresAt
      : input.now;

  if (input.durationDays != null && input.durationDays > 0) {
    return addDaysSaoPaulo(base, input.durationDays);
  }
  if (input.durationMonths != null && input.durationMonths > 0) {
    return addMonthsSaoPaulo(base, input.durationMonths);
  }
  throw new Error("Duração do plano inválida.");
}

export function normalizeMoneyAmount(value: { toFixed: (d: number) => string } | string | number): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Valor inválido.");
    return value.toFixed(2);
  }
  if (typeof value === "string") {
    const n = Number(value.trim().replace(",", "."));
    if (!Number.isFinite(n)) throw new Error("Valor inválido.");
    return n.toFixed(2);
  }
  return value.toFixed(2);
}

export function amountsMatchExact(
  orderAmount: { toFixed: (d: number) => string } | string | number,
  paymentAmount: number,
): boolean {
  if (!Number.isFinite(paymentAmount)) return false;
  return normalizeMoneyAmount(orderAmount) === paymentAmount.toFixed(2);
}

export function expectedLiveMode(mode: WebhookMercadoPagoMode): boolean {
  return mode === "production";
}

/** Só `approved` libera acesso. */
export function shouldGrantAccessForPaymentStatus(status: string): boolean {
  return status.trim().toLowerCase() === "approved";
}

export function shouldRevokeAccessForPaymentStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  // cancelled após approved (painel do vendedor) também remove o acesso deste pedido.
  return s === "refunded" || s === "charged_back" || s === "cancelled";
}

/**
 * Texto amigável do motivo do estorno para e-mail / UI.
 */
export function describeMercadoPagoRefundReason(input: {
  status: string;
  statusDetail?: string | null;
}): { title: string; detail: string } {
  const status = input.status.trim().toLowerCase();
  const detail = (input.statusDetail ?? "").trim().toLowerCase();

  if (status === "refunded") {
    if (detail.includes("partial")) {
      return {
        title: "Reembolso parcial",
        detail:
          "O Mercado Pago registrou um reembolso parcial deste pagamento. O pedido foi estornado no site e o acesso vinculado a ele foi reavaliado.",
      };
    }
    if (detail.includes("admin") || detail.includes("collector") || detail.includes("by_admin")) {
      return {
        title: "Reembolso feito pela equipe",
        detail:
          "A Brazilian Remix Service solicitou o estorno deste pagamento no Mercado Pago. O valor volta conforme o prazo do meio usado (Pix/cartão).",
      };
    }
    return {
      title: "Pagamento reembolsado",
      detail:
        "O Mercado Pago confirmou o reembolso total deste pagamento. O pedido foi cancelado no site e o acesso VIP vinculado a ele foi removido, se não houver outro plano ativo.",
    };
  }

  if (status === "charged_back") {
    if (detail === "in_process") {
      return {
        title: "Contestação em andamento",
        detail:
          "Há um chargeback (contestação) em análise neste pagamento. Por segurança, o acesso VIP deste pedido foi suspenso até a resolução.",
      };
    }
    if (detail === "settled") {
      return {
        title: "Chargeback confirmado",
        detail:
          "A contestação deste pagamento foi decidida e o valor foi estornado. O acesso VIP deste pedido permanece cancelado.",
      };
    }
    return {
      title: "Chargeback no pagamento",
      detail:
        "O Mercado Pago registrou um chargeback neste pagamento. O pedido foi estornado no site e o acesso vinculado a ele foi reavaliado.",
    };
  }

  if (status === "cancelled") {
    return {
      title: "Pagamento cancelado",
      detail:
        "Este pagamento foi cancelado no Mercado Pago após ter sido aprovado. O pedido foi encerrado no site e o acesso VIP vinculado a ele foi removido, se não houver outro plano ativo.",
    };
  }

  return {
    title: "Estorno do pagamento",
    detail:
      "Recebemos uma atualização de estorno deste pagamento no Mercado Pago. O pedido foi atualizado no site.",
  };
}

/**
 * Estorno/chargeback de um pedido MP não deve derrubar VIP se ainda houver
 * outro pedido MP aprovado ou cobertura Hotmart ativa.
 */
export function shouldRevokeVipAfterOrderRefund(input: {
  hasOtherApprovedMercadoPagoOrders: boolean;
  hasActiveHotmartCoverage: boolean;
}): boolean {
  if (input.hasOtherApprovedMercadoPagoOrders) return false;
  if (input.hasActiveHotmartCoverage) return false;
  return true;
}

/** Mapeia status MP → status interno do pedido (histórico preservado). */
export function mapPaymentStatusToOrderStatus(status: string): MercadoPagoOrderStatus | null {
  switch (status.trim().toLowerCase()) {
    case "approved":
      return "APPROVED";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "PENDING";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return null;
  }
}

/**
 * Transições fora de ordem: não rebaixa APPROVED para pending/rejected.
 * Permite APPROVED → REFUNDED/CANCELLED e PENDING → qualquer mapeado.
 */
export function decideWebhookStatusTransition(
  existing: { status: MercadoPagoOrderStatus; mercadoPagoPaymentId: string | null },
  incoming: { mercadoPagoPaymentId: string; status: MercadoPagoOrderStatus },
): { apply: true } | { apply: false; reason: "duplicate" | "unchanged" | "conflict" | "stale" } {
  const base = decideMercadoPagoPaymentUpdate(existing, incoming);
  if (!base.apply) return base;

  if (
    existing.status === "APPROVED" &&
    (incoming.status === "PENDING" || incoming.status === "REJECTED")
  ) {
    return { apply: false, reason: "stale" };
  }

  // Cancelamento de pedido ainda PENDING não precisa “revogar” VIP (nunca liberou).
  // APPROVED → CANCELLED/REFUNDED continua permitido via decideMercadoPagoPaymentUpdate.

  if (
    isTerminalMercadoPagoStatus(existing.status) &&
    existing.status === "REFUNDED" &&
    incoming.status === "APPROVED"
  ) {
    // Mesmo payment após refund não reativa; outro payment_id cai em conflict no decide base.
    if (
      existing.mercadoPagoPaymentId &&
      existing.mercadoPagoPaymentId === incoming.mercadoPagoPaymentId
    ) {
      return { apply: false, reason: "stale" };
    }
  }

  return { apply: true };
}

export type PaymentValidationFailure =
  | "missing_external_reference"
  | "order_not_found"
  | "amount_mismatch"
  | "currency_mismatch"
  | "plan_mismatch"
  | "live_mode_mismatch"
  | "preference_mismatch"
  | "collector_mismatch"
  | "invalid_plan";

export function validatePaymentAgainstOrder(input: {
  order: OrderForPaymentValidation | null;
  payment: MercadoPagoPaymentSnapshot;
  mode: WebhookMercadoPagoMode;
  expectedCollectorId?: number | null;
}): { ok: true; order: OrderForPaymentValidation } | { ok: false; reason: PaymentValidationFailure } {
  const { payment, mode } = input;
  if (!payment.externalReference?.trim()) {
    return { ok: false, reason: "missing_external_reference" };
  }
  if (!input.order) {
    return { ok: false, reason: "order_not_found" };
  }
  const order = input.order;

  if (order.currency.toUpperCase() !== MERCADO_PAGO_CURRENCY) {
    return { ok: false, reason: "currency_mismatch" };
  }
  if ((payment.currencyId || "").toUpperCase() !== MERCADO_PAGO_CURRENCY) {
    return { ok: false, reason: "currency_mismatch" };
  }
  if (!amountsMatchExact(order.amount, payment.transactionAmount)) {
    return { ok: false, reason: "amount_mismatch" };
  }
  if (!order.planId?.trim()) {
    return { ok: false, reason: "invalid_plan" };
  }
  if (payment.metadataPlanId && payment.metadataPlanId !== order.planId) {
    return { ok: false, reason: "plan_mismatch" };
  }
  if (payment.liveMode !== expectedLiveMode(mode)) {
    return { ok: false, reason: "live_mode_mismatch" };
  }
  if (
    order.mercadoPagoPreferenceId &&
    payment.preferenceId &&
    order.mercadoPagoPreferenceId !== payment.preferenceId
  ) {
    return { ok: false, reason: "preference_mismatch" };
  }
  if (
    input.expectedCollectorId != null &&
    payment.collectorId != null &&
    Number(payment.collectorId) !== Number(input.expectedCollectorId)
  ) {
    return { ok: false, reason: "collector_mismatch" };
  }

  return { ok: true, order };
}

export function isPaymentWebhookEvent(typeOrTopic: string | null | undefined): boolean {
  const value = (typeOrTopic ?? "").trim().toLowerCase();
  return (
    value === "payment" ||
    value === "topic_payments_wh" ||
    value.startsWith("payment.")
  );
}
