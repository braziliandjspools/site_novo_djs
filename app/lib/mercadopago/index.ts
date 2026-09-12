import "server-only";

/**
 * Mercado Pago Checkout Pro — Preference + pedidos no Postgres.
 */
export {
  getMercadoPagoEnv,
  getMercadoPagoMode,
  isMercadoPagoTestMode,
  type MercadoPagoEnv,
  type MercadoPagoMode,
} from "./env";

export { getMercadoPagoClient, getMercadoPagoConfig } from "./client";

export {
  buildMercadoPagoExternalReference,
  decideMercadoPagoPaymentUpdate,
  isTerminalMercadoPagoStatus,
  MERCADO_PAGO_CURRENCY,
  MERCADO_PAGO_PROVIDER,
} from "./order-policy";

export {
  attachMercadoPagoPreferenceId,
  createPendingMercadoPagoOrder,
  findMercadoPagoOrderByExternalReference,
  findMercadoPagoOrderByPaymentId,
  markMercadoPagoOrderPreferenceFailed,
  updateMercadoPagoPaymentIdempotent,
  type CreatePendingMercadoPagoOrderInput,
  type IdempotentPaymentUpdateResult,
  type UpdateMercadoPagoPaymentInput,
} from "./orders";

export {
  createMercadoPagoCheckoutPreference,
  type PreferenceCheckoutResult,
} from "./preference";

export {
  buildMercadoPagoPreferenceBody,
  MERCADO_PAGO_NOTIFICATION_URL,
  resolveCheckoutUrl,
  sanitizeMercadoPagoErrorMessage,
  type MercadoPagoPreferenceBody,
  type PreferenceCheckoutMode,
  type PreferencePayer,
} from "./preference-policy";

export {
  amountsMatchExact,
  computeVipAccessPeriodEnd,
  decideWebhookStatusTransition,
  expectedLiveMode,
  isPaymentWebhookEvent,
  mapPaymentStatusToOrderStatus,
  shouldGrantAccessForPaymentStatus,
  shouldRevokeAccessForPaymentStatus,
  shouldRevokeVipAfterOrderRefund,
  describeMercadoPagoRefundReason,
  userHasActiveVipAccess,
  validatePaymentAgainstOrder,
} from "./webhook-policy";

export { processMercadoPagoWebhook } from "./process-webhook";

export {
  extractTrustedReturnLookup,
  mapOrderStatusToPublicPhase,
  PAYMENT_STATUS_MAX_POLLS,
  type PublicOrderPhase,
} from "./return-policy";

export { getSafeMercadoPagoOrderStatusForUser } from "./order-status";
