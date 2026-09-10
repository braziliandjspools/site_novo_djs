import assert from "node:assert/strict";
import { test } from "node:test";

import { isValidHotmartWebhookToken } from "./verify";
import {
  extractExternalUserId,
  extractBuyerEmail,
  isActivationEvent,
  isCancellationEvent,
  isChargebackEvent,
  isRefundEvent,
  resolvePeriodEnd,
  HOTMART_EVENTS,
  type HotmartWebhookPayload,
} from "./types";
import { resolveInternalPlan } from "./config";
import { SITE_PLANS } from "../plans";

test("webhook token inválido é rejeitado", () => {
  assert.equal(isValidHotmartWebhookToken("", "secret"), false);
  assert.equal(isValidHotmartWebhookToken("wrong", "secret"), false);
  assert.equal(isValidHotmartWebhookToken("secret", ""), false);
});

test("webhook token válido é aceito", () => {
  assert.equal(isValidHotmartWebhookToken("hotmart-token", "hotmart-token"), true);
});

test("/plans expõe teste + 3 planos canônicos", () => {
  assert.equal(SITE_PLANS.length, 4);
  assert.deepEqual(
    SITE_PLANS.map((plan) => plan.id),
    ["brs-drive-3d", "brs-drive-1m", "brs-drive-3m", "brs-drive-12m"],
  );
  assert.equal(SITE_PLANS[0]?.price, "R$ 1,00");
  assert.equal(SITE_PLANS[1]?.price, "R$ 38,00");
  assert.equal(SITE_PLANS[2]?.price, "R$ 102,60");
  assert.equal(SITE_PLANS[3]?.price, "R$ 384,00");
});

test("extrai brs_user_id do xcod", () => {
  const payload: HotmartWebhookPayload = {
    data: { purchase: { origin: { xcod: "brs_user_id=99" } } },
  };
  assert.equal(extractExternalUserId(payload), 99);
});

test("extrai email do comprador", () => {
  const payload: HotmartWebhookPayload = {
    data: { buyer: { email: "DJ@Example.COM" } },
  };
  assert.equal(extractBuyerEmail(payload), "dj@example.com");
});

test("mapeia eventos reais da Hotmart", () => {
  assert.equal(isActivationEvent(HOTMART_EVENTS.PURCHASE_APPROVED), true);
  assert.equal(isActivationEvent(HOTMART_EVENTS.PURCHASE_COMPLETE), true);
  assert.equal(isRefundEvent(HOTMART_EVENTS.PURCHASE_REFUNDED), true);
  assert.equal(isChargebackEvent(HOTMART_EVENTS.PURCHASE_CHARGEBACK), true);
  assert.equal(isCancellationEvent(HOTMART_EVENTS.SUBSCRIPTION_CANCELLATION), true);
  assert.equal(isCancellationEvent(HOTMART_EVENTS.PURCHASE_CANCELED), true);
});

test("produto não reconhecido retorna null", () => {
  process.env.HOTMART_DRIVE_MONTHLY_PRODUCT_ID = "111";
  process.env.HOTMART_DRIVE_MONTHLY_OFFER_CODE = "abc";
  assert.equal(resolveInternalPlan({ productId: "999", offerCode: "zzz" }), null);
});

test("resolve produto Hotmart legado por productId", () => {
  process.env.HOTMART_DRIVE_MONTHLY_PRODUCT_ID = "111";
  process.env.HOTMART_DRIVE_MONTHLY_OFFER_CODE = "abc";
  const plan = resolveInternalPlan({ productId: "111", offerCode: "abc" });
  assert.equal(plan?.planId, "drive-monthly");
});

test("resolvePeriodEnd usa date_next_charge quando disponível", () => {
  const end = resolvePeriodEnd({
    data: {
      purchase: { date_next_charge: Date.parse("2030-01-15T12:00:00Z") },
    },
  } as HotmartWebhookPayload);
  assert.ok(end);
  assert.equal(end?.toISOString().startsWith("2030-01-15"), true);
});
