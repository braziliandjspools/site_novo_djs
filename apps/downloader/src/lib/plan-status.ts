import type { MessageKey } from "../i18n/translate";
import { tRuntime } from "../i18n/runtime";

export type PlanBillingInfo = {
  nextDueAt: string;
  nextDueLabel: string;
  daysUntilDue: number;
  status: "ok" | "expiring" | "expired" | "none";
  expired: boolean;
  expiringSoon: boolean;
};

export type PlanServices = {
  poolsVip: boolean;
  deemix: boolean;
  allavsoft: boolean;
};

export type AuthUser = {
  name: string;
  email?: string;
  whatsapp?: string | null;
  plan: string;
  planLabel?: string;
  services?: PlanServices;
  servicesLabel?: string;
  monthlyValue?: number;
  monthlyValueLabel?: string;
  billing?: PlanBillingInfo | null;
};

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function planNotificationMessages(
  billing: PlanBillingInfo | null | undefined,
  t: TranslateFn = tRuntime,
): string[] {
  if (!billing || billing.status === "none" || billing.status === "ok") return [];

  if (billing.expired) {
    return [t("planExpiredBody", { date: billing.nextDueLabel })];
  }

  const days = billing.daysUntilDue;
  if (days <= 0) {
    return [t("planDueToday", { date: billing.nextDueLabel })];
  }
  if (days === 1) {
    return [t("planDueTomorrow", { date: billing.nextDueLabel })];
  }
  if (days <= 5) {
    return [t("planDueInDays", { days, date: billing.nextDueLabel })];
  }
  return [];
}
