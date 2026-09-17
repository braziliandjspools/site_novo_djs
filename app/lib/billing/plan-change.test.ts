import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyPlanChangeQuoteToPlan,
  buildPlanChangeQuote,
  inferVipPeriodDaysFromValue,
  isProratedPlanChangeOrder,
  resolveVipPeriodContext,
} from "./plan-change";
import { getCanonicalPlanById } from "./plan-catalog";

test("inferVipPeriodDaysFromValue mapeia valores canônicos", () => {
  assert.equal(inferVipPeriodDaysFromValue(3.5), 3);
  assert.equal(inferVipPeriodDaysFromValue(35.5), 30);
  assert.equal(inferVipPeriodDaysFromValue(100), 90);
  assert.equal(inferVipPeriodDaysFromValue(200), 180);
});

test("buildPlanChangeQuote aplica crédito e redefine vencimento a partir de agora", () => {
  const now = new Date("2026-09-17T15:00:00.000Z");
  const due = new Date("2026-10-02T15:00:00.000Z");
  const user = {
    services: { poolsVip: true, deemix: false, allavsoft: false },
    serviceBilling: {
      poolsVip: { value: 35.5, dueAt: due },
      deemix: { value: 0, dueAt: null },
      allavsoft: { value: 0, dueAt: null },
    },
    nextDueAt: due,
  };

  const quote = buildPlanChangeQuote({
    user,
    targetPlanId: "brs-drive-3m",
    periodContext: {
      paidAmountBrl: 35.5,
      periodDays: 30,
      planId: "brs-drive-1m",
      planTitle: "BRS Drive — Mensal",
    },
    now,
  });

  assert.ok(quote);
  assert.equal(quote!.remainingDays, 15);
  assert.equal(quote!.creditBrl, "17.75");
  assert.equal(quote!.amountDueBrl, "82.25");

  const applied = applyPlanChangeQuoteToPlan(quote!);
  assert.equal(applied.amountBrl, "82.25");
  assert.match(applied.title, /Troca de plano/);
});

test("buildPlanChangeQuote mensal com pouco crédito cobra diferença", () => {
  const now = new Date("2026-09-17T15:00:00.000Z");
  const due = new Date("2026-09-20T15:00:00.000Z");
  const user = {
    services: { poolsVip: true, deemix: false, allavsoft: false },
    serviceBilling: {
      poolsVip: { value: 100, dueAt: due },
      deemix: { value: 0, dueAt: null },
      allavsoft: { value: 0, dueAt: null },
    },
    nextDueAt: due,
  };

  const quote = buildPlanChangeQuote({
    user,
    targetPlanId: "brs-drive-1m",
    periodContext: resolveVipPeriodContext({
      billingValue: 100,
      lastApproved: { planId: "brs-drive-3m", amount: 100 },
    }),
    now,
  });

  assert.ok(quote);
  assert.equal(quote!.creditBrl, "3.33");
  assert.equal(quote!.amountDueBrl, "32.17");
});

test("isProratedPlanChangeOrder detecta valor abaixo do catálogo", () => {
  const plan = getCanonicalPlanById("brs-drive-1m")!;
  assert.equal(
    isProratedPlanChangeOrder({
      plan,
      orderAmountBrl: "32.17",
      hasActiveVip: true,
    }),
    true,
  );
  assert.equal(
    isProratedPlanChangeOrder({
      plan,
      orderAmountBrl: "35.50",
      hasActiveVip: true,
    }),
    false,
  );
});
