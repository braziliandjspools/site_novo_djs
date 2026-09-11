import assert from "node:assert/strict";
import { test } from "node:test";
import { getCanonicalPlanById } from "../billing/plan-catalog";
import {
  buildMercadoPagoPreferenceBody,
  MERCADO_PAGO_NOTIFICATION_URL,
  resolveCheckoutUrl,
  sanitizeMercadoPagoErrorMessage,
} from "./preference-policy";

test("preference body usa BRL, quantity 1, back_urls e auto_return", () => {
  const plan = getCanonicalPlanById("brs-drive-1m");
  assert.ok(plan);

  const body = buildMercadoPagoPreferenceBody({
    plan,
    externalReference: "brs_mp_order-1",
    siteUrl: "https://www.brazilianremixservice.com.br",
    payer: { id: 7, email: "dj@example.com", name: "DJ Teste" },
  });

  assert.equal(body.items.length, 1);
  assert.equal(body.items[0]?.quantity, 1);
  assert.equal(body.items[0]?.currency_id, "BRL");
  assert.equal(body.items[0]?.unit_price, 38);
  assert.equal(body.external_reference, "brs_mp_order-1");
  assert.equal(body.auto_return, "approved");
  assert.equal(body.notification_url, MERCADO_PAGO_NOTIFICATION_URL);
  assert.equal(body.back_urls.success, "https://www.brazilianremixservice.com.br/pagamento/sucesso");
  assert.equal(body.back_urls.pending, "https://www.brazilianremixservice.com.br/pagamento/pendente");
  assert.equal(body.back_urls.failure, "https://www.brazilianremixservice.com.br/pagamento/erro");
  assert.equal(body.metadata.brs_plan_id, "brs-drive-1m");
  assert.equal(body.metadata.brs_service_product, "poolsVip");
});

test("preference Deemix histórico (includeInactive) inclui metadata do produto e preço 30", () => {
  const plan = getCanonicalPlanById("brs-deemix-1m", { includeInactive: true });
  assert.ok(plan);

  const body = buildMercadoPagoPreferenceBody({
    plan,
    externalReference: "brs_mp_order-deemix",
    siteUrl: "https://www.brazilianremixservice.com.br",
    payer: { id: 7, email: "dj@example.com", name: "DJ Teste" },
  });

  assert.equal(body.items[0]?.unit_price, 30);
  assert.equal(body.metadata.brs_service_product, "deemix");
  assert.equal(body.metadata.brs_plan_id, "brs-deemix-1m");
});

test("preference body rejeita siteUrl sem HTTPS", () => {
  const plan = getCanonicalPlanById("brs-drive-3m");
  assert.ok(plan);
  assert.throws(() =>
    buildMercadoPagoPreferenceBody({
      plan,
      externalReference: "brs_mp_x",
      siteUrl: "http://localhost:3000",
      payer: { id: 1, email: "a@b.com", name: "A" },
    }),
  );
});

test("resolveCheckoutUrl usa sandbox em test e init_point em production", () => {
  assert.equal(
    resolveCheckoutUrl({
      mode: "test",
      initPoint: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=prod",
      sandboxInitPoint: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test",
    }),
    "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test",
  );

  assert.equal(
    resolveCheckoutUrl({
      mode: "production",
      initPoint: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=prod",
      sandboxInitPoint: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test",
    }),
    "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=prod",
  );
});

test("sanitizeMercadoPagoErrorMessage remove Access Token", () => {
  const msg = sanitizeMercadoPagoErrorMessage(
    new Error("Unauthorized APP_USR-1234567890-abcdef Bearer APP_USR-zzz"),
  );
  assert.equal(msg.includes("APP_USR-1234567890"), false);
  assert.match(msg, /\[redacted\]/);
});
