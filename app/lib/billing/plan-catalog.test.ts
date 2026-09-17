import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertCheckoutPayloadTrusted,
  CANONICAL_PLANS,
  formatPlanAmountBrl,
  getCanonicalPlanById,
  listActiveCanonicalPlans,
  resolveCanonicalPlanId,
} from "./plan-catalog";

test("catálogo ativo tem Drive (4) + Allavsoft (1); Deemix descontinuado", () => {
  const plans = listActiveCanonicalPlans();
  assert.equal(plans.length, 5);
  assert.deepEqual(
    plans.map((p) => p.id),
    [
      "brs-drive-3d",
      "brs-drive-1m",
      "brs-drive-pro-1m",
      "brs-drive-max-1m",
      "brs-allavsoft-lifetime",
    ],
  );
});

test("Allavsoft vitalícia custa R$ 50,00", () => {
  const plan = getCanonicalPlanById("brs-allavsoft-lifetime");
  assert.equal(plan?.amountBrl, "50.00");
  assert.equal(plan?.serviceProduct, "allavsoft");
  assert.equal(plan?.lifetime, true);
  assert.equal(plan?.durationDays, 0);
});

test("Deemix: planos históricos inativos (ainda resolvíveis com includeInactive)", () => {
  assert.equal(getCanonicalPlanById("brs-deemix-1m"), null);
  assert.equal(getCanonicalPlanById("brs-deemix-1m", { includeInactive: true })?.amountBrl, "30.00");
});

test("plano teste 3 dias custa R$ 1,00 e dura 3 dias", () => {
  const plan = getCanonicalPlanById("brs-drive-3d");
  assert.equal(plan?.amountBrl, "1.00");
  assert.equal(plan?.durationDays, 3);
  assert.equal(plan?.isTestPlan, true);
});

test("valores canônicos Drive: 38 / 42 / 46 com cotas", () => {
  assert.equal(getCanonicalPlanById("brs-drive-1m")?.amountBrl, "38.00");
  assert.equal(getCanonicalPlanById("brs-drive-pro-1m")?.amountBrl, "42.00");
  assert.equal(getCanonicalPlanById("brs-drive-max-1m")?.amountBrl, "46.00");
  assert.equal(getCanonicalPlanById("brs-drive-1m")?.downloaderQuotaTier, "STARTER");
  assert.equal(getCanonicalPlanById("brs-drive-pro-1m")?.downloaderQuotaTier, "PRO");
  assert.equal(getCanonicalPlanById("brs-drive-max-1m")?.downloaderQuotaTier, "MAX");
});

test("planos 3m/12m legados inativos", () => {
  assert.equal(getCanonicalPlanById("brs-drive-3m"), null);
  assert.equal(getCanonicalPlanById("brs-drive-12m"), null);
  assert.equal(getCanonicalPlanById("brs-drive-3m", { includeInactive: true })?.amountBrl, "102.60");
  assert.equal(getCanonicalPlanById("brs-drive-12m", { includeInactive: true })?.amountBrl, "384.00");
});

test("alias legado drive-monthly resolve para Essencial", () => {
  assert.equal(resolveCanonicalPlanId("drive-monthly"), "brs-drive-1m");
  assert.equal(getCanonicalPlanById("drive-monthly")?.id, "brs-drive-1m");
});

test("planId desconhecido é rejeitado", () => {
  assert.equal(getCanonicalPlanById("plano-hackeado"), null);
  assert.equal(resolveCanonicalPlanId(""), null);
});

test("checkout confia só em planId — rejeita amount do cliente", () => {
  const attack = assertCheckoutPayloadTrusted({
    planId: "brs-drive-1m",
    amount: 1,
  });
  assert.equal(attack.ok, false);
  if (!attack.ok) {
    assert.match(attack.error, /não podem ser enviados/i);
  }
});

test("checkout rejeita price/duration manipulados", () => {
  assert.equal(assertCheckoutPayloadTrusted({ planId: "brs-drive-1m", price: "R$ 1,00" }).ok, false);
  assert.equal(assertCheckoutPayloadTrusted({ planId: "brs-drive-1m", durationMonths: 99 }).ok, false);
  assert.equal(assertCheckoutPayloadTrusted({ planId: "brs-drive-1m", amountBrl: "0.01" }).ok, false);
});

test("checkout válido devolve plano Pro do servidor", () => {
  const result = assertCheckoutPayloadTrusted({ planId: "brs-drive-pro-1m" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.plan.amountBrl, "42.00");
    assert.equal(result.plan.durationMonths, 1);
    assert.equal(result.plan.renewalType, "manual");
  }
});

test("mesmo planId sempre retorna o mesmo amount (imutável)", () => {
  const a = getCanonicalPlanById("brs-drive-max-1m");
  const b = getCanonicalPlanById("brs-drive-max-1m");
  assert.equal(a?.amountBrl, b?.amountBrl);
  assert.match(formatPlanAmountBrl(a!.amountBrl), /46/);
});

test("CANONICAL_PLANS tem ids únicos", () => {
  const ids = CANONICAL_PLANS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});
