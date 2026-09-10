import type { MercadoPagoOrderStatus } from "@prisma/client";

export const MERCADO_PAGO_PROVIDER = "mercadopago" as const;
export const MERCADO_PAGO_CURRENCY = "BRL" as const;

const TERMINAL_STATUSES: ReadonlySet<MercadoPagoOrderStatus> = new Set([
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "REFUNDED",
]);

export function isTerminalMercadoPagoStatus(status: MercadoPagoOrderStatus) {
  return TERMINAL_STATUSES.has(status);
}

/** Monta external_reference estável que identifica o pedido interno BRS. */
export function buildMercadoPagoExternalReference(orderId: string) {
  return `brs_mp_${orderId}`;
}

/**
 * Decide se um update de pagamento deve ser aplicado (lógica pura / testável).
 * Impede reprocessar o mesmo payment_id e conflito com outro pagamento já terminal.
 */
export function decideMercadoPagoPaymentUpdate(
  existing: { status: MercadoPagoOrderStatus; mercadoPagoPaymentId: string | null },
  incoming: { mercadoPagoPaymentId: string; status: MercadoPagoOrderStatus },
): { apply: true } | { apply: false; reason: "duplicate" | "unchanged" | "conflict" } {
  const samePayment =
    existing.mercadoPagoPaymentId != null &&
    existing.mercadoPagoPaymentId === incoming.mercadoPagoPaymentId;

  if (samePayment) {
    if (existing.status === incoming.status) {
      return { apply: false, reason: existing.status === "PENDING" ? "unchanged" : "duplicate" };
    }
    return { apply: true };
  }

  if (
    existing.mercadoPagoPaymentId &&
    existing.mercadoPagoPaymentId !== incoming.mercadoPagoPaymentId &&
    isTerminalMercadoPagoStatus(existing.status)
  ) {
    return { apply: false, reason: "conflict" };
  }

  return { apply: true };
}
