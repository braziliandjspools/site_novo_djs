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

test("catálogo ativo: 1m + 3m + 6m + 12m + Allavsoft", () => {
  const plans = listActiveCanonicalPlans();
  assert.equal(plans.length, 5);
  assert.deepEqual(
    plans.map((p) => p.id),
    [
      "brs-drive-1m",
      "brs-drive-3m",
      "brs-drive-6m",
      "brs-drive-12m",
      "brs-allavsoft-lifetime",
    ],
  );
});

test("planos de assinatura do portal são 1/3/6/12 meses", () => {
  assert.deepEqual(
    listPortalSubscriptionPlans().map((p) => p.id),
    ["brs-drive-1m", "brs-drive-3m", "brs-drive-6m", "brs-drive-12m"],
  );
});

test("valores canônicos: mensal 35 / trimestral 96 / semestral 180 / anual 336", () => {
  assert.equal(getCanonicalPlanById("brs-drive-3d"), null);
  assert.equal(getCanonicalPlanById("brs-drive-3d", { includeInactive: true })?.active, false);
  assert.equal(getCanonicalPlanById("brs-drive-1m")?.amountBrl, "35.00");
  assert.equal(getCanonicalPlanById("brs-drive-3m")?.amountBrl, "96.00");
  assert.equal(getCanonicalPlanById("brs-drive-6m")?.amountBrl, "180.00");
  assert.equal(getCanonicalPlanById("brs-drive-12m")?.amountBrl, "336.00");
  assert.equal(getCanonicalPlanById("brs-drive-12m")?.equivalentMonthlyLabel, "R$ 28,00/mês");
  assert.equal(getCanonicalPlanById("brs-drive-3m")?.durationDays, 90);
  assert.equal(getCanonicalPlanById("brs-drive-6m")?.durationDays, 180);
});

test("Allavsoft vitalícia custa R$ 50,00", () => {
  const plan = getCanonicalPlanById("brs-allavsoft-lifetime");
  assert.equal(plan?.amountBrl, "50.00");
  assert.equal(plan?.lifetime, true);
});

test("planos Pro/Max legados inativos", () => {
  assert.equal(getCanonicalPlanById("brs-drive-pro-1m"), null);
  assert.equal(getCanonicalPlanById("brs-drive-max-1m"), null);
  assert.equal(getCanonicalPlanById("brs-drive-12m")?.active, true);
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
    assert.equal(result.plan.amountBrl, "96.00");
    assert.equal(result.plan.durationMonths, 3);
  }
});

test("formatPlanAmountBrl e ids únicos", () => {
  assert.match(formatPlanAmountBrl("35.00"), /35/);
  const ids = CANONICAL_PLANS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});
