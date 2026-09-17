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
    plan: "VIP",
    services: { poolsVip: true, deemix: false, allavsoft: false },
    serviceBilling: {
      poolsVip: { value: 35.5, dueAt: soon },
      deemix: { value: 0, dueAt: null },
      allavsoft: { value: 0, dueAt: null },
    },
    monthlyValue: 35.5,
    nextDueAt: soon,
    active: true,
    musicProducerDeliveriesEnabled: false,
    downloaderQuotaTier: "STARTER",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

test("lista renováveis dentro de 5 dias", () => {
  const items = listPortalRenewableServices(baseUser());
  assert.equal(items.length, 1);
  assert.equal(items[0]?.key, "poolsVip");
});

test("buildPortalRenewalPlan usa plano 1 mês do catálogo por padrão", () => {
  const built = buildPortalRenewalPlan(baseUser(), "poolsVip");
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.plan.id, "brs-drive-1m");
  assert.equal(built.plan.amountBrl, "35.50");
});

test("buildPortalRenewalPlan aceita trimestral", () => {
  const built = buildPortalRenewalPlan(baseUser(), "poolsVip", "brs-drive-3m");
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.plan.id, "brs-drive-3m");
  assert.equal(built.plan.amountBrl, "100.00");
});

test("fora da janela não renova", () => {
  const far = new Date();
  far.setDate(far.getDate() + 20);
  const user = baseUser({
    serviceBilling: {
      poolsVip: { value: 35.5, dueAt: far },
      deemix: { value: 0, dueAt: null },
      allavsoft: { value: 0, dueAt: null },
    },
    nextDueAt: far,
  });
  assert.equal(listPortalRenewableServices(user).length, 0);
  assert.equal(buildPortalRenewalPlan(user, "poolsVip").ok, false);
});
