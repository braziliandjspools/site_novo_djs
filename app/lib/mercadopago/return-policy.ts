/**
 * Helpers seguros para páginas de retorno do Checkout Pro.
 * Nunca confiar em status/payment_id/collection_status da URL.
 */

const EXTERNAL_REF_RE = /^brs_mp_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Params da URL do Mercado Pago que NÃO devem ser usados para liberar acesso. */
export const UNTRUSTED_PAYMENT_URL_PARAMS = [
  "status",
  "payment_id",
  "payment_status",
  "collection_status",
  "collection_id",
  "merchant_order_id",
  "preference_id",
  "payment_type",
  "site_id",
  "processing_mode",
  "merchant_account_id",
] as const;

export function isTrustedExternalReference(value: string | null | undefined): value is string {
  return typeof value === "string" && EXTERNAL_REF_RE.test(value.trim());
}

export function isTrustedOrderId(value: string | null | undefined): value is string {
  return typeof value === "string" && ORDER_ID_RE.test(value.trim());
}

/**
 * Extrai só chaves confiáveis da query de retorno.
 * Ignora deliberadamente status/payment_id/collection_status.
 */
export function extractTrustedReturnLookup(searchParams: URLSearchParams | Record<string, string | string[] | undefined>) {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const raw = searchParams[key];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  const externalReference = get("external_reference");
  const orderId = get("orderId") ?? get("order_id");

  return {
    externalReference: isTrustedExternalReference(externalReference) ? externalReference.trim() : null,
    orderId: isTrustedOrderId(orderId) ? orderId.trim() : null,
  };
}

export type PublicOrderPhase =
  | "confirming"
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "not_found";

export function mapOrderStatusToPublicPhase(
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "REFUNDED",
): PublicOrderPhase {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "PENDING":
      return "confirming";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    default:
      return "confirming";
  }
}

/** Limite de atualizações de status no frontend (polling). */
export const PAYMENT_STATUS_MAX_POLLS = 15;
export const PAYMENT_STATUS_POLL_INTERVAL_MS = 2500;
