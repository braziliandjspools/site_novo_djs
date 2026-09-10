import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMercadoPagoExternalReference,
  decideMercadoPagoPaymentUpdate,
  isTerminalMercadoPagoStatus,
  MERCADO_PAGO_CURRENCY,
  MERCADO_PAGO_PROVIDER,
} from "./order-policy";

test("external_reference identifica o pedido interno", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(buildMercadoPagoExternalReference(id), `brs_mp_${id}`);
});

test("provider e currency padrão são mercadopago/BRL", () => {
  assert.equal(MERCADO_PAGO_PROVIDER, "mercadopago");
  assert.equal(MERCADO_PAGO_CURRENCY, "BRL");
});

test("status terminais", () => {
  assert.equal(isTerminalMercadoPagoStatus("PENDING"), false);
  assert.equal(isTerminalMercadoPagoStatus("APPROVED"), true);
  assert.equal(isTerminalMercadoPagoStatus("REJECTED"), true);
  assert.equal(isTerminalMercadoPagoStatus("CANCELLED"), true);
  assert.equal(isTerminalMercadoPagoStatus("REFUNDED"), true);
});

test("mesmo payment_id + mesmo status aprovado = duplicate (não reprocessa)", () => {
  const decision = decideMercadoPagoPaymentUpdate(
    { status: "APPROVED", mercadoPagoPaymentId: "pay_1" },
    { mercadoPagoPaymentId: "pay_1", status: "APPROVED" },
  );
  assert.deepEqual(decision, { apply: false, reason: "duplicate" });
});

test("mesmo payment_id PENDING → APPROVED = aplica", () => {
  const decision = decideMercadoPagoPaymentUpdate(
    { status: "PENDING", mercadoPagoPaymentId: "pay_1" },
    { mercadoPagoPaymentId: "pay_1", status: "APPROVED" },
  );
  assert.deepEqual(decision, { apply: true });
});

test("pedido já aprovado com outro payment_id = conflict", () => {
  const decision = decideMercadoPagoPaymentUpdate(
    { status: "APPROVED", mercadoPagoPaymentId: "pay_1" },
    { mercadoPagoPaymentId: "pay_2", status: "APPROVED" },
  );
  assert.deepEqual(decision, { apply: false, reason: "conflict" });
});

test("primeiro payment em pedido pending = aplica", () => {
  const decision = decideMercadoPagoPaymentUpdate(
    { status: "PENDING", mercadoPagoPaymentId: null },
    { mercadoPagoPaymentId: "pay_9", status: "APPROVED" },
  );
  assert.deepEqual(decision, { apply: true });
});
