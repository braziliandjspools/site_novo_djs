import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPortalRenewalPlan, listPortalRenewableServices } from "./portal-renewals";
import type { PortalUser } from "./portal-users";

function baseUser(overrides: Partial<PortalUser> = {}): PortalUser {
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  return {
    id: 1,
    name: "DJ",
    email: "dj@example.com",
    whatsapp: "11999999999",
    passwordHash: "x",
    plan: "VIP",
    services: { poolsVip: true, deemix: true, allavsoft: false },
    serviceBilling: {
      poolsVip: { value: 45, dueAt: soon },
      deemix: { value: 30, dueAt: soon },
      allavsoft: { value: 0, dueAt: null },
    },
    monthlyValue: 75,
    nextDueAt: soon,
    active: true,
    musicProducerDeliveriesEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PortalUser;
}

test("lista renováveis dentro de 5 dias com valores do billing", () => {
  const items = listPortalRenewableServices(baseUser());
  assert.equal(items.length, 2);
  assert.equal(items[0]?.dueDayKey, items[1]?.dueDayKey);
  assert.ok(items.some((i) => i.key === "poolsVip" && i.value === 45));
  assert.ok(items.some((i) => i.key === "deemix" && i.value === 30));
});

test("buildPortalRenewalPlan usa valor do usuário e plano 1 mês", () => {
  const built = buildPortalRenewalPlan(baseUser(), "poolsVip");
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.plan.id, "brs-drive-1m");
  assert.equal(built.plan.amountBrl, "45.00");
  assert.match(built.plan.title, /Renovação Pools VIP/);
});

test("fora da janela não renova", () => {
  const far = new Date();
  far.setDate(far.getDate() + 20);
  const user = baseUser({
    services: { poolsVip: true, deemix: false, allavsoft: false },
    serviceBilling: {
      poolsVip: { value: 38, dueAt: far },
      deemix: { value: 0, dueAt: null },
      allavsoft: { value: 0, dueAt: null },
    },
    nextDueAt: far,
  });
  assert.equal(listPortalRenewableServices(user).length, 0);
  const built = buildPortalRenewalPlan(user, "poolsVip");
  assert.equal(built.ok, false);
});
