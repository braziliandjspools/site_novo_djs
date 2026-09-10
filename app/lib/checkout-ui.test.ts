import assert from "node:assert/strict";
import { test } from "node:test";
import { friendlyCheckoutError, resolveCheckoutPlanId } from "./checkout-ui";

const plans = [{ id: "brs-drive-1m" }, { id: "brs-drive-3m" }, { id: "brs-drive-12m" }];

test("resolveCheckoutPlanId aceita ids canônicos", () => {
  assert.equal(resolveCheckoutPlanId("brs-drive-1m", plans), "brs-drive-1m");
  assert.equal(resolveCheckoutPlanId("brs-drive-12m", plans), "brs-drive-12m");
});

test("resolveCheckoutPlanId mapeia alias legado drive-monthly", () => {
  assert.equal(resolveCheckoutPlanId("drive-monthly", plans), "brs-drive-1m");
});

test("resolveCheckoutPlanId rejeita planId desconhecido", () => {
  assert.equal(resolveCheckoutPlanId("unknown-plan", plans), null);
});

test("friendlyCheckoutError prioriza mensagem da API e cobre status comuns", () => {
  assert.equal(friendlyCheckoutError(400, "Plano inválido"), "Plano inválido");
  assert.match(friendlyCheckoutError(429), /Muitas tentativas/);
  assert.match(friendlyCheckoutError(503), /não configurado/i);
  assert.match(friendlyCheckoutError(502), /preparar o pagamento/i);
  assert.match(
    friendlyCheckoutError(409, "Você já tem VIP ativo até 13/10/2026."),
    /VIP ativo/,
  );
});
