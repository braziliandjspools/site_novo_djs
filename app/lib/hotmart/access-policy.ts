import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Política de acesso Hotmart — regras puras cobertas por testes.
 * A liberação real só ocorre após webhook validado (nunca via /checkout/success).
 */

export function shouldReactivateAfterRevocation(input: {
  existingStatus: "REFUNDED" | "CHARGEBACK" | "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE";
  existingTransactionId: string | null;
  incomingTransactionId: string;
}) {
  if (input.existingStatus !== "REFUNDED" && input.existingStatus !== "CHARGEBACK") {
    return true;
  }
  // Mesmo transaction após refund/chargeback não reativa.
  if (
    input.existingTransactionId &&
    input.existingTransactionId === input.incomingTransactionId
  ) {
    return false;
  }
  // Nova cobrança (transaction diferente) pode reativar.
  return true;
}

export function cancellationRevokesImmediately() {
  return false;
}

export function checkoutSuccessGrantsAccess() {
  return false;
}

test("refund/chargeback do mesmo transaction não reativa", () => {
  assert.equal(
    shouldReactivateAfterRevocation({
      existingStatus: "REFUNDED",
      existingTransactionId: "HP1",
      incomingTransactionId: "HP1",
    }),
    false,
  );
  assert.equal(
    shouldReactivateAfterRevocation({
      existingStatus: "CHARGEBACK",
      existingTransactionId: "HP1",
      incomingTransactionId: "HP2",
    }),
    true,
  );
});

test("cancelamento não remove acesso imediatamente", () => {
  assert.equal(cancellationRevokesImmediately(), false);
});

test("redirect de sucesso NÃO prova pagamento", () => {
  assert.equal(checkoutSuccessGrantsAccess(), false);
});
