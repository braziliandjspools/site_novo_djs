import { daysUntilDue, formatDueDate, getDueUrgency } from "./due-queue";
import {
  formatMonthlyValue,
  getServicesLabel,
  type PortalUser,
  userHasPools,
} from "./portal-users";

export type PlanBillingStatus = "ok" | "expiring" | "expired" | "none";

export function getPlanBillingStatus(user: Pick<PortalUser, "services" | "nextDueAt">): PlanBillingStatus {
  if (!userHasPools(user)) return "none";
  const urgency = getDueUrgency(user.nextDueAt);
  if (urgency === "overdue") return "expired";
  if (urgency === "soon") return "expiring";
  return "ok";
}

export function isDownloaderPlanExpired(user: Pick<PortalUser, "services" | "nextDueAt">) {
  return getPlanBillingStatus(user) === "expired";
}

export function buildPlanBillingPayload(user: PortalUser) {
  const status = getPlanBillingStatus(user);
  const days = daysUntilDue(user.nextDueAt);
  return {
    nextDueAt: user.nextDueAt.toISOString(),
    nextDueLabel: formatDueDate(user.nextDueAt),
    daysUntilDue: days,
    status,
    expired: status === "expired",
    expiringSoon: status === "expiring",
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
