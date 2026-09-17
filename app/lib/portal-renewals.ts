import type { CanonicalPlan } from "./billing/plan-catalog";
import {
  getCanonicalPlanById,
  isPortalSubscriptionPlanId,
  listPortalSubscriptionPlans,
  type PortalSubscriptionPlanId,
} from "./billing/plan-catalog";
import {
  buildPlanChangeQuote,
  resolveVipPeriodContext,
  type PlanChangeQuote,
} from "./billing/plan-change";
import { daysUntilDue, formatDueDate, getDueUrgency, getSaoPauloDateParts } from "./due-queue";
import { prisma } from "./prisma";
import { formatMonthlyValue, type PortalUser } from "./portal-users";
import { userHasActiveVipAccess } from "./mercadopago/webhook-policy";

export const PORTAL_RENEWAL_WINDOW_DAYS = 5;

export type PortalRenewalServiceKey = "poolsVip";

export type PortalRenewableService = {
  key: PortalRenewalServiceKey;
  label: string;
  value: number;
  valueLabel: string;
  dueAt: string;
  dueLabel: string;
  dueDayKey: string;
  daysUntilDue: number;
  urgency: "soon" | "overdue";
};

function dueDayKey(date: Date | string) {
  const parts = getSaoPauloDateParts(typeof date === "string" ? new Date(date) : date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/** Já usou o Plano Teste (pedido aprovado com planId de teste). */
export async function hasUsedDriveTestPlan(portalUserId: number): Promise<boolean> {
  const count = await prisma.mercadoPagoOrder.count({
    where: {
      portalUserId,
      status: "APPROVED",
      planId: "brs-drive-3d",
    },
  });
  return count > 0;
}

/** Último pedido VIP aprovado (para crédito na troca de plano). */
export async function getLastApprovedVipOrder(portalUserId: number) {
  return prisma.mercadoPagoOrder.findFirst({
    where: {
      portalUserId,
      status: "APPROVED",
      planId: { startsWith: "brs-drive" },
    },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    select: { planId: true, amount: true, approvedAt: true },
  });
}

export async function getVipPeriodContextForUser(user: PortalUser) {
  const last = await getLastApprovedVipOrder(user.id);
  return resolveVipPeriodContext({
    billingValue: user.serviceBilling.poolsVip.value,
    lastApproved: last
      ? { planId: last.planId, amount: Number(last.amount) }
      : null,
  });
}

/** Cotação de troca com crédito residual (VIP ativo). */
export async function quotePortalPlanChange(
  user: PortalUser,
  targetPlanId: string,
  now = new Date(),
): Promise<PlanChangeQuote | null> {
  const hasActive = userHasActiveVipAccess({
    servicePoolsVip: user.services.poolsVip,
    nextDueAt: user.nextDueAt,
    servicePoolsVipDueAt: user.serviceBilling.poolsVip.dueAt,
    now,
  });
  if (!hasActive) return null;
  const periodContext = await getVipPeriodContextForUser(user);
  return buildPlanChangeQuote({ user, targetPlanId, periodContext, now });
}

/** Serviços renováveis na janela de 5 dias (ou já vencidos), com valor > 0. */
export function listPortalRenewableServices(
  user: Pick<PortalUser, "services" | "serviceBilling" | "nextDueAt">,
): PortalRenewableService[] {
  const items: PortalRenewableService[] = [];

  if (user.services.poolsVip) {
    const due = user.serviceBilling.poolsVip.dueAt ?? user.nextDueAt;
    const urgency = getDueUrgency(due);
    const value = user.serviceBilling.poolsVip.value;
    if (urgency && value > 0) {
      items.push({
        key: "poolsVip",
        label: "Pools VIP",
        value,
        valueLabel: formatMonthlyValue(value),
        dueAt: due.toISOString(),
        dueLabel: formatDueDate(due),
        dueDayKey: dueDayKey(due),
        daysUntilDue: daysUntilDue(due),
        urgency,
      });
    }
  }

  return items.sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.key.localeCompare(b.key));
}

export function isPortalRenewalServiceKey(value: unknown): value is PortalRenewalServiceKey {
  return value === "poolsVip";
}

/**
 * Renovação na janela: usa o plano escolhido (1/3/6) do catálogo.
 * Se não informar planId, mantém o mensal como padrão.
 */
export function buildPortalRenewalPlan(
  user: Pick<PortalUser, "services" | "serviceBilling" | "nextDueAt">,
  service: PortalRenewalServiceKey,
  targetPlanId: PortalSubscriptionPlanId = "brs-drive-1m",
): { ok: true; plan: CanonicalPlan; renewable: PortalRenewableService } | { ok: false; error: string; code: string } {
  const renewable = listPortalRenewableServices(user).find((item) => item.key === service);
  if (!renewable) {
    return {
      ok: false,
      error: "Este serviço não está na janela de renovação (até 5 dias antes do vencimento ou já vencido).",
      code: "renewal_not_available",
    };
  }

  if (!isPortalSubscriptionPlanId(targetPlanId)) {
    return { ok: false, error: "Plano de renovação inválido.", code: "invalid_renewal_plan" };
  }

  const base = getCanonicalPlanById(targetPlanId);
  if (!base) {
    return { ok: false, error: "Plano de renovação indisponível.", code: "renewal_plan_missing" };
  }

  const plan: CanonicalPlan = {
    ...base,
    title: `Renovação ${renewable.label} — ${base.durationLabel}`,
    description: `Renovação manual do ${renewable.label} (${base.durationLabel}) com vencimento em ${renewable.dueLabel}. Pagamento único.`,
    badge: renewable.urgency === "overdue" ? "Vencido" : "Renovação",
    highlight: true,
    isTestPlan: false,
  };

  return { ok: true, plan, renewable };
}

export type PortalPlanChangeCard = {
  id: string;
  name: string;
  price: string;
  period: string;
  durationMonths: number;
  description: string;
  badge: string | null;
  highlight: boolean;
  catalogPrice?: string;
  creditLabel?: string | null;
  remainingDays?: number | null;
  amountDueLabel?: string | null;
  projectedDueLabel?: string | null;
};

/** Cards públicos para troca de plano no portal (com crédito se VIP ativo). */
export async function listPortalPlanChangeCards(user?: PortalUser): Promise<PortalPlanChangeCard[]> {
  const periodContext = user ? await getVipPeriodContextForUser(user) : null;
  const now = new Date();

  return listPortalSubscriptionPlans().map((plan) => {
    const quote =
      user && periodContext
        ? buildPlanChangeQuote({
            user,
            targetPlanId: plan.id,
            periodContext,
            now,
          })
        : null;

    return {
      id: plan.id,
      name: plan.title,
      price: quote?.amountDueLabel ?? formatMonthlyValue(Number(plan.amountBrl)),
      catalogPrice: formatMonthlyValue(Number(plan.amountBrl)),
      period: plan.durationLabel,
      durationMonths: plan.durationMonths,
      description: plan.description,
      badge: plan.badge,
      highlight: plan.highlight,
      creditLabel: quote && Number(quote.creditBrl) > 0 ? quote.creditLabel : null,
      remainingDays: quote?.remainingDays ?? null,
      amountDueLabel: quote?.amountDueLabel ?? null,
      projectedDueLabel: quote?.projectedPeriodEndLabel ?? null,
    };
  });
}

export function serializePortalRenewables(
  user: Pick<PortalUser, "services" | "serviceBilling" | "nextDueAt">,
) {
  return listPortalRenewableServices(user).map((item) => ({
    key: item.key,
    label: item.label,
    value: item.value,
    valueLabel: item.valueLabel,
    dueAt: item.dueAt,
    dueLabel: item.dueLabel,
    dueDayKey: item.dueDayKey,
    daysUntilDue: item.daysUntilDue,
    urgency: item.urgency,
  }));
}
