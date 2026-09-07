import { HOTMART_DRIVE_MONTHLY_PLAN } from "./plans";

export type HotmartWebhookPayload = {
  id?: string;
  event?: string;
  creation_date?: number;
  version?: string;
  data?: {
    product?: {
      id?: number | string;
      ucode?: string;
      name?: string;
    };
    buyer?: {
      email?: string;
      name?: string;
      first_name?: string;
      last_name?: string;
    };
    purchase?: {
      transaction?: string;
      status?: string;
      approved_date?: number;
      date_next_charge?: number;
      recurrence_number?: number;
      order_date?: string;
      offer?: {
        code?: string;
        name?: string;
      };
      origin?: {
        src?: string;
        sck?: string;
        xcod?: string;
      };
      price?: {
        value?: number;
      };
    };
    subscription?: {
      status?: string;
      subscriber?: {
        code?: string;
      };
      plan?: {
        id?: number | string;
        name?: string;
      };
    };
  };
};

/** Eventos reais da Hotmart (purchase + subscription) que tratamos. */
export const HOTMART_EVENTS = {
  PURCHASE_APPROVED: "PURCHASE_APPROVED",
  PURCHASE_COMPLETE: "PURCHASE_COMPLETE",
  PURCHASE_REFUNDED: "PURCHASE_REFUNDED",
  PURCHASE_CHARGEBACK: "PURCHASE_CHARGEBACK",
  PURCHASE_CANCELED: "PURCHASE_CANCELED",
  PURCHASE_EXPIRED: "PURCHASE_EXPIRED",
  PURCHASE_DELAYED: "PURCHASE_DELAYED",
  PURCHASE_BILLET_PRINTED: "PURCHASE_BILLET_PRINTED",
  PURCHASE_PROTEST: "PURCHASE_PROTEST",
  SUBSCRIPTION_CANCELLATION: "SUBSCRIPTION_CANCELLATION",
  UPDATE_SUBSCRIPTION_CHARGE_DATE: "UPDATE_SUBSCRIPTION_CHARGE_DATE",
  SWITCH_PLAN: "SWITCH_PLAN",
} as const;

export type HotmartEventName = (typeof HOTMART_EVENTS)[keyof typeof HOTMART_EVENTS];

export function parseHotmartPayload(raw: unknown): HotmartWebhookPayload | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as HotmartWebhookPayload;
}

export function extractBuyerEmail(payload: HotmartWebhookPayload) {
  return payload.data?.buyer?.email?.trim().toLowerCase() ?? "";
}

export function extractBuyerName(payload: HotmartWebhookPayload) {
  const buyer = payload.data?.buyer;
  if (!buyer) return "";
  if (buyer.name?.trim()) return buyer.name.trim();
  return [buyer.first_name, buyer.last_name].filter(Boolean).join(" ").trim();
}

export function extractTransactionId(payload: HotmartWebhookPayload) {
  return payload.data?.purchase?.transaction?.trim() ?? "";
}

export function extractSubscriberCode(payload: HotmartWebhookPayload) {
  return payload.data?.subscription?.subscriber?.code?.trim() ?? "";
}

export function extractOfferCode(payload: HotmartWebhookPayload) {
  return payload.data?.purchase?.offer?.code?.trim() ?? "";
}

export function extractProductId(payload: HotmartWebhookPayload) {
  const id = payload.data?.product?.id;
  return id != null ? String(id) : "";
}

/** Extrai brs_user_id de xcod/sck/src (ex.: brs_user_id=12345). */
export function extractExternalUserId(payload: HotmartWebhookPayload): number | null {
  const origin = payload.data?.purchase?.origin;
  const candidates = [origin?.xcod, origin?.sck, origin?.src].filter(Boolean) as string[];
  for (const raw of candidates) {
    const decoded = decodeURIComponent(raw);
    const match =
      decoded.match(/(?:^|[?&])brs_user_id=(\d+)/i) ||
      decoded.match(/^brs_user_id[_=:-]?(\d+)$/i) ||
      decoded.match(/^(\d+)$/);
    if (match?.[1]) {
      const id = Number(match[1]);
      if (Number.isInteger(id) && id > 0) return id;
    }
  }
  return null;
}

export function msToDate(ms?: number | null) {
  if (ms == null || !Number.isFinite(ms)) return null;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolvePeriodEnd(payload: HotmartWebhookPayload, fallbackDays = 30) {
  const next = msToDate(payload.data?.purchase?.date_next_charge);
  if (next) return next;
  const approved = msToDate(payload.data?.purchase?.approved_date) ?? new Date();
  const end = new Date(approved);
  end.setUTCDate(end.getUTCDate() + fallbackDays);
  return end;
}

export function isActivationEvent(event: string) {
  return event === HOTMART_EVENTS.PURCHASE_APPROVED || event === HOTMART_EVENTS.PURCHASE_COMPLETE;
}

export function isRefundEvent(event: string) {
  return event === HOTMART_EVENTS.PURCHASE_REFUNDED;
}

export function isChargebackEvent(event: string) {
  return event === HOTMART_EVENTS.PURCHASE_CHARGEBACK;
}

export function isCancellationEvent(event: string) {
  return (
    event === HOTMART_EVENTS.SUBSCRIPTION_CANCELLATION ||
    event === HOTMART_EVENTS.PURCHASE_CANCELED
  );
}

export function isIgnoredPurchaseEvent(event: string) {
  return (
    event === HOTMART_EVENTS.PURCHASE_BILLET_PRINTED ||
    event === HOTMART_EVENTS.PURCHASE_PROTEST ||
    event === HOTMART_EVENTS.PURCHASE_DELAYED ||
    event === HOTMART_EVENTS.SWITCH_PLAN
  );
}

export function planDisplayName(planId: string) {
  if (planId === HOTMART_DRIVE_MONTHLY_PLAN.id) return HOTMART_DRIVE_MONTHLY_PLAN.name;
  return planId;
}
