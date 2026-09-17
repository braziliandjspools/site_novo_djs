/**
 * Troca de plano VIP com crédito do período restante.
 * Crédito = (dias restantes / dias do período atual) × valor pago do plano atual.
 * Valor a pagar = preço do novo plano − crédito (mín. R$ 1,00 no Mercado Pago).
 * Após o pagamento, o vencimento passa a ser agora + duração do novo plano
 * (o restante foi convertido em crédito, não se soma de novo).
 */

import {
  formatPlanAmountBrl,
  getCanonicalPlanById,
  isPortalSubscriptionPlanId,
  type CanonicalPlan,
  type PortalSubscriptionPlanId,
} from "./plan-catalog";
import { daysUntilDue, formatDueDate } from "../due-queue";
import {
  addDaysSaoPaulo,
  userHasActiveVipAccess,
} from "../mercadopago/webhook-policy";
import type { PortalUser } from "../portal-users";

/** Mercado Pago Checkout Pro — valor mínimo prático em BRL. */
export const PLAN_CHANGE_MIN_CHARGE_BRL = 1;

export type VipPeriodContext = {
  paidAmountBrl: number;
  periodDays: number;
  planId: string | null;
  planTitle: string | null;
};

export type PlanChangeQuote = {
  targetPlanId: PortalSubscriptionPlanId;
  targetPlan: CanonicalPlan;
  /** Preço de tabela do plano alvo. */
  catalogAmountBrl: string;
  catalogAmountLabel: string;
  remainingDays: number;
  periodDays: number;
  /** Crédito do período não usado. */
  creditBrl: string;
  creditLabel: string;
  /** Valor cobrado no Mercado Pago. */
  amountDueBrl: string;
  amountDueLabel: string;
  /** Dias extras se o crédito cobriu o plano e sobrou. */
  bonusDays: number;
  /** Novo vencimento após aprovação (a partir de agora). */
  projectedPeriodEnd: Date;
  projectedPeriodEndLabel: string;
  previousDueAt: Date;
  previousDueLabel: string;
  previousPlanTitle: string | null;
  isPlanChange: true;
};

function roundMoney(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0.00";
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Infere duração do período a partir do valor cobrado / billing. */
export function inferVipPeriodDaysFromValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 30;
  if (value <= 5) return 3;
  if (value <= 50) return 30;
  if (value <= 150) return 90;
  return 180;
}

export function resolveVipPeriodContext(input: {
  billingValue: number;
  lastApproved?: {
    planId: string;
    amount: number;
  } | null;
}): VipPeriodContext {
  if (input.lastApproved) {
    const plan = getCanonicalPlanById(input.lastApproved.planId, { includeInactive: true });
    const periodDays =
      plan && plan.durationDays > 0
        ? plan.durationDays
        : inferVipPeriodDaysFromValue(input.lastApproved.amount);
    return {
      paidAmountBrl: input.lastApproved.amount,
      periodDays,
      planId: input.lastApproved.planId,
      planTitle: plan?.title ?? null,
    };
  }

  const paidAmountBrl = input.billingValue > 0 ? input.billingValue : 35.5;
  return {
    paidAmountBrl,
    periodDays: inferVipPeriodDaysFromValue(paidAmountBrl),
    planId: null,
    planTitle: null,
  };
}

/**
 * Calcula crédito e valor a pagar para troca de plano com VIP ativo.
 * Retorna null se não for troca elegível (sem VIP ativo ou plano inválido).
 */
export function buildPlanChangeQuote(input: {
  user: Pick<PortalUser, "services" | "serviceBilling" | "nextDueAt">;
  targetPlanId: string;
  periodContext: VipPeriodContext;
  now?: Date;
}): PlanChangeQuote | null {
  if (!isPortalSubscriptionPlanId(input.targetPlanId)) return null;

  const now = input.now ?? new Date();
  const due = input.user.serviceBilling.poolsVip.dueAt ?? input.user.nextDueAt;
  const hasActive = userHasActiveVipAccess({
    servicePoolsVip: input.user.services.poolsVip,
    nextDueAt: input.user.nextDueAt,
    servicePoolsVipDueAt: input.user.serviceBilling.poolsVip.dueAt,
    now,
  });
  if (!hasActive) return null;

  const targetPlan = getCanonicalPlanById(input.targetPlanId);
  if (!targetPlan || targetPlan.serviceProduct !== "poolsVip") return null;

  const remainingDays = Math.max(0, daysUntilDue(due));
  const periodDays = Math.max(1, input.periodContext.periodDays);
  const paid = Math.max(0, input.periodContext.paidAmountBrl);
  const rawCredit = remainingDays <= 0 ? 0 : (remainingDays / periodDays) * paid;
  const credit = Math.min(paid, Math.max(0, rawCredit));

  const catalog = Number(targetPlan.amountBrl);
  const dailyNew = catalog / Math.max(1, targetPlan.durationDays);
  let amountDue = catalog - credit;
  let bonusDays = 0;

  if (amountDue <= 0) {
    const leftover = credit - catalog;
    bonusDays = dailyNew > 0 ? Math.floor(leftover / dailyNew) : 0;
    amountDue = PLAN_CHANGE_MIN_CHARGE_BRL;
  } else if (amountDue < PLAN_CHANGE_MIN_CHARGE_BRL) {
    amountDue = PLAN_CHANGE_MIN_CHARGE_BRL;
  }

  const amountDueBrl = roundMoney(amountDue);
  const creditBrl = roundMoney(credit);
  const projectedPeriodEnd = addDaysSaoPaulo(
    now,
    targetPlan.durationDays + bonusDays,
  );

  return {
    targetPlanId: input.targetPlanId,
    targetPlan,
    catalogAmountBrl: targetPlan.amountBrl,
    catalogAmountLabel: formatPlanAmountBrl(targetPlan.amountBrl),
    remainingDays,
    periodDays,
    creditBrl,
    creditLabel: formatPlanAmountBrl(creditBrl),
    amountDueBrl,
    amountDueLabel: formatPlanAmountBrl(amountDueBrl),
    bonusDays,
    projectedPeriodEnd,
    projectedPeriodEndLabel: formatDueDate(projectedPeriodEnd),
    previousDueAt: due,
    previousDueLabel: formatDueDate(due),
    previousPlanTitle: input.periodContext.planTitle,
    isPlanChange: true,
  };
}

/** Plano efetivo no checkout: preço = amountDue, texto com crédito. */
export function applyPlanChangeQuoteToPlan(
  quote: PlanChangeQuote,
): CanonicalPlan {
  const creditNote =
    Number(quote.creditBrl) > 0
      ? ` Crédito de ${quote.creditLabel} pelos ${quote.remainingDays} dia(s) restantes.`
      : "";
  return {
    ...quote.targetPlan,
    amountBrl: quote.amountDueBrl,
    title: `Troca de plano — ${quote.targetPlan.durationLabel}`,
    description: `Upgrade/downgrade para ${quote.targetPlan.title}.${creditNote} Novo vencimento estimado: ${quote.projectedPeriodEndLabel}.`,
    badge: "Troca",
    highlight: true,
    isTestPlan: false,
  };
}

/** Detecta troca com crédito: VIP ativo e valor cobrado abaixo do catálogo. */
export function isProratedPlanChangeOrder(input: {
  plan: CanonicalPlan;
  orderAmountBrl: string | number;
  hasActiveVip: boolean;
}): boolean {
  if (!input.hasActiveVip) return false;
  if (!isPortalSubscriptionPlanId(input.plan.id)) return false;
  const paid = Number(
    typeof input.orderAmountBrl === "number"
      ? input.orderAmountBrl.toFixed(2)
      : input.orderAmountBrl,
  );
  const catalog = Number(input.plan.amountBrl);
  if (!Number.isFinite(paid) || !Number.isFinite(catalog)) return false;
  return paid + 0.009 < catalog;
}
