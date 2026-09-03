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

export function planNotificationMessages(billing: PlanBillingInfo | null | undefined): string[] {
  if (!billing || billing.status === "none" || billing.status === "ok") return [];

  if (billing.expired) {
    return [
      `Plano vencido desde ${billing.nextDueLabel}. Renove no Portal para continuar usando o Downloader.`,
    ];
  }

  const days = billing.daysUntilDue;
  if (days <= 0) {
    return [`Seu plano vence hoje (${billing.nextDueLabel}). Renove no Portal para não perder o acesso.`];
  }
  if (days === 1) {
    return [`Seu plano vence amanhã (${billing.nextDueLabel}).`];
  }
  if (days <= 5) {
    return [`Seu plano vence em ${days} dias (${billing.nextDueLabel}).`];
  }
  return [];
}
