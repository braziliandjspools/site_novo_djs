import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertCheckoutPayloadTrusted,
  CANONICAL_PLANS,
  formatPlanAmountBrl,
  getCanonicalPlanById,
  listActiveCanonicalPlans,
  listPortalSubscriptionPlans,
  resolveCanonicalPlanId,
} from "./plan-catalog";

test("catálogo ativo: teste + 1m + 3m + 6m + Allavsoft", () => {
  const plans = listActiveCanonicalPlans();
  assert.equal(plans.length, 5);
  assert.deepEqual(
    plans.map((p) => p.id),
    [
      "brs-drive-3d",
      "brs-drive-1m",
      "brs-drive-3m",
      "brs-drive-6m",
      "brs-allavsoft-lifetime",
    ],
  );
});

test("planos de assinatura do portal são 1/3/6 meses", () => {
  assert.deepEqual(
    listPortalSubscriptionPlans().map((p) => p.id),
    ["brs-drive-1m", "brs-drive-3m", "brs-drive-6m"],
  );
});

test("valores canônicos: teste 3.50 / mensal 35.50 / trimestral 100 / semestral 200", () => {
  assert.equal(getCanonicalPlanById("brs-drive-3d")?.amountBrl, "3.50");
  assert.equal(getCanonicalPlanById("brs-drive-3d")?.isTestPlan, true);
  assert.equal(getCanonicalPlanById("brs-drive-1m")?.amountBrl, "35.50");
  assert.equal(getCanonicalPlanById("brs-drive-3m")?.amountBrl, "100.00");
  assert.equal(getCanonicalPlanById("brs-drive-6m")?.amountBrl, "200.00");
  assert.equal(getCanonicalPlanById("brs-drive-3m")?.durationDays, 90);
  assert.equal(getCanonicalPlanById("brs-drive-6m")?.durationDays, 180);
});

test("Allavsoft vitalícia custa R$ 50,00", () => {
  const plan = getCanonicalPlanById("brs-allavsoft-lifetime");
  assert.equal(plan?.amountBrl, "50.00");
  assert.equal(plan?.lifetime, true);
});

test("planos Pro/Max/12m legados inativos", () => {
  assert.equal(getCanonicalPlanById("brs-drive-pro-1m"), null);
  assert.equal(getCanonicalPlanById("brs-drive-max-1m"), null);
  assert.equal(getCanonicalPlanById("brs-drive-12m"), null);
});

test("alias legado drive-monthly resolve para mensal", () => {
  assert.equal(resolveCanonicalPlanId("drive-monthly"), "brs-drive-1m");
});

test("checkout rejeita preço do cliente", () => {
  assert.equal(assertCheckoutPayloadTrusted({ planId: "brs-drive-1m" }).ok, true);
  assert.equal(assertCheckoutPayloadTrusted({ planId: "brs-drive-1m", price: "1" }).ok, false);
});

test("checkout válido devolve trimestral", () => {
  const result = assertCheckoutPayloadTrusted({ planId: "brs-drive-3m" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.plan.amountBrl, "100.00");
    assert.equal(result.plan.durationMonths, 3);
  }
});

test("formatPlanAmountBrl e ids únicos", () => {
  assert.match(formatPlanAmountBrl("35.50"), /35/);
  const ids = CANONICAL_PLANS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});
