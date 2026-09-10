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

test("catálogo ativo tem Drive (4) + Deemix (3) + Allavsoft (1)", () => {
  const plans = listActiveCanonicalPlans();
  assert.equal(plans.length, 8);
  assert.deepEqual(
    plans.map((p) => p.id),
    [
      "brs-drive-3d",
      "brs-drive-1m",
      "brs-drive-3m",
      "brs-drive-12m",
      "brs-deemix-1m",
      "brs-deemix-3m",
      "brs-deemix-6m",
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

test("Deemix: 30 / 81 / 162 com 10% nos longos", () => {
  assert.equal(getCanonicalPlanById("brs-deemix-1m")?.amountBrl, "30.00");
  assert.equal(getCanonicalPlanById("brs-deemix-1m")?.serviceProduct, "deemix");
  assert.equal(getCanonicalPlanById("brs-deemix-1m")?.durationDays, 30);

  const monthly = 30;
  assert.equal((monthly * 3 * 0.9).toFixed(2), "81.00");
  assert.equal(getCanonicalPlanById("brs-deemix-3m")?.amountBrl, "81.00");
  assert.equal(getCanonicalPlanById("brs-deemix-3m")?.durationDays, 90);

  assert.equal((monthly * 6 * 0.9).toFixed(2), "162.00");
  assert.equal(getCanonicalPlanById("brs-deemix-6m")?.amountBrl, "162.00");
  assert.equal(getCanonicalPlanById("brs-deemix-6m")?.durationDays, 180);
});

test("plano teste 3 dias custa R$ 1,00 e dura 3 dias", () => {
  const plan = getCanonicalPlanById("brs-drive-3d");
  assert.equal(plan?.amountBrl, "1.00");
  assert.equal(plan?.durationDays, 3);
  assert.equal(plan?.isTestPlan, true);
});

test("valores canônicos: 1m 38 / 3m 102.60 / 12m 384", () => {
  assert.equal(getCanonicalPlanById("brs-drive-1m")?.amountBrl, "38.00");
  assert.equal(getCanonicalPlanById("brs-drive-3m")?.amountBrl, "102.60");
  assert.equal(getCanonicalPlanById("brs-drive-12m")?.amountBrl, "384.00");
});

test("3 meses = 10% off sobre 3×38", () => {
  const monthly = 38;
  const expected = (monthly * 3 * 0.9).toFixed(2);
  assert.equal(expected, "102.60");
  assert.equal(getCanonicalPlanById("brs-drive-3m")?.amountBrl, expected);
});

test("1 ano = 32 × 12", () => {
  assert.equal((32 * 12).toFixed(2), "384.00");
  assert.equal(getCanonicalPlanById("brs-drive-12m")?.amountBrl, "384.00");
});

test("alias legado drive-monthly resolve para 1 mês", () => {
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

test("checkout válido devolve plano do servidor com preço oficial", () => {
  const result = assertCheckoutPayloadTrusted({ planId: "brs-drive-3m" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.plan.amountBrl, "102.60");
    assert.equal(result.plan.durationMonths, 3);
    assert.equal(result.plan.renewalType, "manual");
  }
});

test("mesmo planId sempre retorna o mesmo amount (imutável)", () => {
  const a = getCanonicalPlanById("brs-drive-12m");
  const b = getCanonicalPlanById("brs-drive-12m");
  assert.equal(a?.amountBrl, b?.amountBrl);
  assert.equal(formatPlanAmountBrl(a!.amountBrl), "R$ 384,00");
});

test("todos os planos são renovação manual e BRL", () => {
  for (const plan of CANONICAL_PLANS) {
    assert.equal(plan.renewalType, "manual");
    assert.equal(plan.currency, "BRL");
    assert.equal(plan.active, true);
  }
});
