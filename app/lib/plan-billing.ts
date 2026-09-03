import { daysUntilDue, formatDueDate, getDueUrgency } from "./due-queue";
import type { PortalUser } from "./portal-users";
import { userHasPools } from "./portal-users";

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
    dueDay: user.dueDay,
    nextDueAt: user.nextDueAt.toISOString(),
    nextDueLabel: formatDueDate(user.nextDueAt),
    daysUntilDue: days,
    status,
    expired: status === "expired",
    expiringSoon: status === "expiring",
  };
}
