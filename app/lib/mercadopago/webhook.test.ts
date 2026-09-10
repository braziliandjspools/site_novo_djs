import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import {
  amountsMatchExact,
  computeVipAccessPeriodEnd,
  decideWebhookStatusTransition,
  expectedLiveMode,
  isPaymentWebhookEvent,
  mapPaymentStatusToOrderStatus,
  shouldGrantAccessForPaymentStatus,
  shouldRevokeAccessForPaymentStatus,
  shouldRevokeVipAfterOrderRefund,
  userHasActiveVipAccess,
  validatePaymentAgainstOrder,
} from "./webhook-policy";

function buildSignature(input: {
  secret: string;
  dataId: string;
  requestId: string;
  ts: string;
}) {
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${input.ts};`;
  const hash = createHmac("sha256", input.secret).update(manifest).digest("hex");
  return `ts=${input.ts},v1=${hash}`;
}

test("assinatura inválida é rejeitada pelo WebhookSignatureValidator", () => {
  const secret = "test-webhook-secret";
  const dataId = "123456789";
  const requestId = "req-abc";
  const ts = String(Math.floor(Date.now() / 1000));

  assert.throws(
    () =>
      WebhookSignatureValidator.validate({
        xSignature: "ts=1,v1=deadbeef",
        xRequestId: requestId,
        dataId,
        secret,
      }),
    (err: unknown) => err instanceof InvalidWebhookSignatureError,
  );

  const valid = buildSignature({ secret, dataId, requestId, ts });
  assert.doesNotThrow(() =>
    WebhookSignatureValidator.validate({
      xSignature: valid,
      xRequestId: requestId,
      dataId,
      secret,
    }),
  );
});

test("aceita somente evento payment", () => {
  assert.equal(isPaymentWebhookEvent("payment"), true);
  assert.equal(isPaymentWebhookEvent("PAYMENT"), true);
  assert.equal(isPaymentWebhookEvent("merchant_order"), false);
  assert.equal(isPaymentWebhookEvent(null), false);
});

test("só approved libera acesso; pending/in_process/rejected não", () => {
  assert.equal(shouldGrantAccessForPaymentStatus("approved"), true);
  assert.equal(shouldGrantAccessForPaymentStatus("APPROVED"), true);
  assert.equal(shouldGrantAccessForPaymentStatus("pending"), false);
  assert.equal(shouldGrantAccessForPaymentStatus("in_process"), false);
  assert.equal(shouldGrantAccessForPaymentStatus("rejected"), false);
  assert.equal(shouldRevokeAccessForPaymentStatus("refunded"), true);
  assert.equal(shouldRevokeAccessForPaymentStatus("charged_back"), true);
  assert.equal(shouldRevokeAccessForPaymentStatus("cancelled"), true);
  assert.equal(shouldRevokeAccessForPaymentStatus("approved"), false);
  assert.equal(mapPaymentStatusToOrderStatus("pending"), "PENDING");
  assert.equal(mapPaymentStatusToOrderStatus("approved"), "APPROVED");
  assert.equal(mapPaymentStatusToOrderStatus("refunded"), "REFUNDED");
});

test("APPROVED → REFUNDED é aplicado (estorno do admin)", () => {
  const decision = decideWebhookStatusTransition(
    { status: "APPROVED", mercadoPagoPaymentId: "pay_1" },
    { mercadoPagoPaymentId: "pay_1", status: "REFUNDED" },
  );
  assert.deepEqual(decision, { apply: true });
});

test("evento payment.* e topic_payments_wh são aceitos", () => {
  assert.equal(isPaymentWebhookEvent("payment.updated"), true);
  assert.equal(isPaymentWebhookEvent("topic_payments_wh"), true);
});

test("pedido inexistente falha na validação", () => {
  const result = validatePaymentAgainstOrder({
    order: null,
    payment: {
      id: "1",
      status: "approved",
      transactionAmount: 38,
      currencyId: "BRL",
      liveMode: false,
      externalReference: "brs_mp_missing",
    },
    mode: "test",
  });
  assert.deepEqual(result, { ok: false, reason: "order_not_found" });
});

test("valor adulterado é rejeitado", () => {
  const result = validatePaymentAgainstOrder({
    order: {
      id: "ord-1",
      portalUserId: 1,
      planId: "brs-drive-1m",
      amount: "38.00",
      currency: "BRL",
      status: "PENDING",
      mercadoPagoPaymentId: null,
      mercadoPagoPreferenceId: null,
      externalReference: "brs_mp_ord-1",
    },
    payment: {
      id: "pay-1",
      status: "approved",
      transactionAmount: 1,
      currencyId: "BRL",
      liveMode: false,
      externalReference: "brs_mp_ord-1",
    },
    mode: "test",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "amount_mismatch");
  assert.equal(amountsMatchExact("38.00", 38), true);
  assert.equal(amountsMatchExact("38.00", 38.01), false);
});

test("pagamento duplicado (mesmo payment_id + status) não reprocessa", () => {
  const decision = decideWebhookStatusTransition(
    { status: "APPROVED", mercadoPagoPaymentId: "pay_1" },
    { mercadoPagoPaymentId: "pay_1", status: "APPROVED" },
  );
  assert.deepEqual(decision, { apply: false, reason: "duplicate" });
});

test("evento pending após approved é stale (fora de ordem)", () => {
  const decision = decideWebhookStatusTransition(
    { status: "APPROVED", mercadoPagoPaymentId: "pay_1" },
    { mercadoPagoPaymentId: "pay_1", status: "PENDING" },
  );
  assert.deepEqual(decision, { apply: false, reason: "stale" });
});

test("live_mode deve bater com MERCADO_PAGO_MODE", () => {
  assert.equal(expectedLiveMode("test"), false);
  assert.equal(expectedLiveMode("production"), true);

  const bad = validatePaymentAgainstOrder({
    order: {
      id: "ord-2",
      portalUserId: 1,
      planId: "brs-drive-1m",
      amount: "38.00",
      currency: "BRL",
      status: "PENDING",
      mercadoPagoPaymentId: null,
      mercadoPagoPreferenceId: null,
      externalReference: "brs_mp_ord-2",
    },
    payment: {
      id: "pay-2",
      status: "approved",
      transactionAmount: 38,
      currencyId: "BRL",
      liveMode: true,
      externalReference: "brs_mp_ord-2",
    },
    mode: "test",
  });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.reason, "live_mode_mismatch");
});

test("extensão de acesso: sem VIP conta da aprovação; com VIP estende do vencimento", () => {
  const now = new Date("2026-03-10T15:00:00.000Z");
  const fromApproval = computeVipAccessPeriodEnd({
    now,
    durationDays: 30,
    hasActiveAccess: false,
    currentExpiresAt: new Date("2025-01-01T12:00:00.000Z"),
  });
  assert.ok(fromApproval.getTime() > now.getTime());

  const currentEnd = new Date("2026-06-10T12:00:00.000Z");
  const extended = computeVipAccessPeriodEnd({
    now,
    durationDays: 90,
    hasActiveAccess: true,
    currentExpiresAt: currentEnd,
  });
  assert.ok(extended.getTime() > currentEnd.getTime());

  const threeDays = computeVipAccessPeriodEnd({
    now,
    durationDays: 3,
    hasActiveAccess: false,
    currentExpiresAt: null,
  });
  assert.ok(threeDays.getTime() > now.getTime());

  assert.equal(
    userHasActiveVipAccess({
      servicePoolsVip: true,
      nextDueAt: currentEnd,
      now,
    }),
    true,
  );
  assert.equal(
    userHasActiveVipAccess({
      servicePoolsVip: true,
      nextDueAt: new Date("2026-01-01T12:00:00.000Z"),
      now,
    }),
    false,
  );
});

test("estorno não revoga VIP se houver outro pedido aprovado ou Hotmart ativo", () => {
  assert.equal(
    shouldRevokeVipAfterOrderRefund({
      hasOtherApprovedMercadoPagoOrders: true,
      hasActiveHotmartCoverage: false,
    }),
    false,
  );
  assert.equal(
    shouldRevokeVipAfterOrderRefund({
      hasOtherApprovedMercadoPagoOrders: false,
      hasActiveHotmartCoverage: true,
    }),
    false,
  );
  assert.equal(
    shouldRevokeVipAfterOrderRefund({
      hasOtherApprovedMercadoPagoOrders: false,
      hasActiveHotmartCoverage: false,
    }),
    true,
  );
});

test("approved válido passa na validação contra o pedido", () => {
  const result = validatePaymentAgainstOrder({
    order: {
      id: "ord-3",
      portalUserId: 9,
      planId: "brs-drive-3m",
      amount: "102.60",
      currency: "BRL",
      status: "PENDING",
      mercadoPagoPaymentId: null,
      mercadoPagoPreferenceId: "pref-1",
      externalReference: "brs_mp_ord-3",
    },
    payment: {
      id: "pay-3",
      status: "approved",
      transactionAmount: 102.6,
      currencyId: "BRL",
      liveMode: false,
      externalReference: "brs_mp_ord-3",
      preferenceId: "pref-1",
      metadataPlanId: "brs-drive-3m",
    },
    mode: "test",
  });
  assert.equal(result.ok, true);
});
