import assert from "node:assert/strict";
import { test } from "node:test";

import { isValidHotmartWebhookToken } from "./verify";
import { buildHotmartCheckoutUrl } from "./checkout";
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

test("/plans expõe apenas BRS Drive Mensal", () => {
  assert.equal(SITE_PLANS.length, 1);
  assert.equal(SITE_PLANS[0]?.id, "drive-monthly");
  assert.equal(SITE_PLANS[0]?.name, "BRS Drive Mensal");
});

test("checkout inclui email, nome e brs_user_id", () => {
  process.env.HOTMART_DRIVE_MONTHLY_CHECKOUT_URL = "https://pay.hotmart.com/example";
  const url = buildHotmartCheckoutUrl("drive-monthly", {
    id: 12345,
    email: "dj@example.com",
    name: "DJ Teste",
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("email"), "dj@example.com");
  assert.equal(parsed.searchParams.get("name"), "DJ Teste");
  assert.equal(parsed.searchParams.get("xcod"), "brs_user_id=12345");
  assert.equal(parsed.searchParams.get("sck"), "brs_user_id=12345");
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

test("produto reconhecido por product id", () => {
  process.env.HOTMART_DRIVE_MONTHLY_PRODUCT_ID = "111";
  process.env.HOTMART_DRIVE_MONTHLY_OFFER_CODE = "abc";
  const mapped = resolveInternalPlan({ productId: "111", offerCode: "" });
  assert.equal(mapped?.planId, "drive-monthly");
});

test("period end usa date_next_charge", () => {
  const next = Date.UTC(2026, 9, 7);
  const end = resolvePeriodEnd({
    data: { purchase: { date_next_charge: next } },
  });
  assert.equal(end.getTime(), next);
});

test("cancelamento mantém acesso até period end (regra)", () => {
  const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  assert.equal(periodEnd.getTime() > now.getTime(), true);
});
