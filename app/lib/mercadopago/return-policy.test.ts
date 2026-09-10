import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractTrustedReturnLookup,
  isTrustedExternalReference,
  isTrustedOrderId,
  mapOrderStatusToPublicPhase,
  UNTRUSTED_PAYMENT_URL_PARAMS,
} from "./return-policy";

test("não confia em status/payment_id/collection_status da URL", () => {
  assert.ok(UNTRUSTED_PAYMENT_URL_PARAMS.includes("status"));
  assert.ok(UNTRUSTED_PAYMENT_URL_PARAMS.includes("payment_id"));
  assert.ok(UNTRUSTED_PAYMENT_URL_PARAMS.includes("collection_status"));

  const params = new URLSearchParams({
    status: "approved",
    payment_id: "999",
    collection_status: "approved",
    external_reference: "brs_mp_11111111-1111-4111-8111-111111111111",
  });

  const lookup = extractTrustedReturnLookup(params);
  assert.equal(lookup.externalReference, "brs_mp_11111111-1111-4111-8111-111111111111");
  assert.equal(lookup.orderId, null);
  // status da URL é ignorado — só usamos a referência interna
  assert.equal("status" in lookup, false);
});

test("external_reference inválido é descartado", () => {
  assert.equal(isTrustedExternalReference("hacked"), false);
  assert.equal(isTrustedExternalReference("brs_mp_not-a-uuid"), false);
  assert.equal(
    isTrustedOrderId("11111111-1111-4111-8111-111111111111"),
    true,
  );
});

test("PENDING vira confirming (webhook ainda não confirmou liberação)", () => {
  assert.equal(mapOrderStatusToPublicPhase("PENDING"), "confirming");
  assert.equal(mapOrderStatusToPublicPhase("APPROVED"), "approved");
  assert.equal(mapOrderStatusToPublicPhase("REJECTED"), "rejected");
});
