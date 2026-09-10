import { daysUntilDue, formatDueDate, getDueUrgency } from "./due-queue";
import {
  formatMonthlyValue,
  getServicesLabel,
  type PortalUser,
  userHasPools,
} from "./portal-users";

export type PlanBillingStatus = "ok" | "expiring" | "expired" | "none";

export function getPlanBillingStatus(
  user: Pick<PortalUser, "services" | "nextDueAt" | "serviceBilling">,
): PlanBillingStatus {
  if (!userHasPools(user)) return "none";
  const due = user.serviceBilling.poolsVip.dueAt ?? user.nextDueAt;
  const urgency = getDueUrgency(due);
  if (urgency === "overdue") return "expired";
  if (urgency === "soon") return "expiring";
  return "ok";
}

export function isDownloaderPlanExpired(
  user: Pick<PortalUser, "services" | "nextDueAt" | "serviceBilling">,
) {
  return getPlanBillingStatus(user) === "expired";
}

export function buildPlanBillingPayload(user: PortalUser) {
  const status = getPlanBillingStatus(user);
  const due = user.serviceBilling.poolsVip.dueAt ?? user.nextDueAt;
  const days = daysUntilDue(due);
  return {
    nextDueAt: due.toISOString(),
    nextDueLabel: formatDueDate(due),
    daysUntilDue: days,
    status,
    expired: status === "expired",
    expiringSoon: status === "expiring",
    services: {
      poolsVip: {
        value: user.serviceBilling.poolsVip.value,
        dueAt: user.serviceBilling.poolsVip.dueAt?.toISOString() ?? null,
      },
      deemix: {
        value: user.serviceBilling.deemix.value,
        dueAt: user.serviceBilling.deemix.dueAt?.toISOString() ?? null,
      },
      allavsoft: {
        value: user.serviceBilling.allavsoft.value,
        dueAt: user.serviceBilling.allavsoft.dueAt?.toISOString() ?? null,
      },
    },
  };
}

/** Payload de conta/plano para o Downloader (mesmos dados reais do Portal web). */
export function buildDownloaderAccountPayload(user: PortalUser) {
  const billing = buildPlanBillingPayload(user);
  const servicesLabel = getServicesLabel(user.services);
  return {
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    plan: user.plan,
    planLabel: servicesLabel,
    services: user.services,
    servicesLabel,
    monthlyValue: user.monthlyValue,
    monthlyValueLabel: formatMonthlyValue(user.monthlyValue),
    billing,
  };
}
