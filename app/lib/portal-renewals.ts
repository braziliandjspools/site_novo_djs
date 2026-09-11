import type { CanonicalPlan } from "./billing/plan-catalog";
import { getCanonicalPlanById } from "./billing/plan-catalog";
import { daysUntilDue, formatDueDate, getDueUrgency, getSaoPauloDateParts } from "./due-queue";
import { formatMonthlyValue, type PortalUser } from "./portal-users";

export const PORTAL_RENEWAL_WINDOW_DAYS = 5;

export type PortalRenewalServiceKey = "poolsVip";

export type PortalRenewableService = {
  key: PortalRenewalServiceKey;
  label: string;
  value: number;
  valueLabel: string;
  dueAt: string;
  dueLabel: string;
  /** Chave de calendário SP (YYYY-MM-DD) para empilhar vencimentos no mesmo dia. */
  dueDayKey: string;
  daysUntilDue: number;
  urgency: "soon" | "overdue";
};

function dueDayKey(date: Date | string) {
  const parts = getSaoPauloDateParts(typeof date === "string" ? new Date(date) : date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function formatAmountBrl(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Valor de renovação inválido.");
  }
  return value.toFixed(2);
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
 * Plano de checkout para renovação: duração 1 mês do catálogo,
 * valor e título vindos do billing do usuário (servidor).
 */
export function buildPortalRenewalPlan(
  user: Pick<PortalUser, "services" | "serviceBilling" | "nextDueAt">,
  service: PortalRenewalServiceKey,
): { ok: true; plan: CanonicalPlan; renewable: PortalRenewableService } | { ok: false; error: string; code: string } {
  const renewable = listPortalRenewableServices(user).find((item) => item.key === service);
  if (!renewable) {
    return {
      ok: false,
      error: "Este serviço não está na janela de renovação (até 5 dias antes do vencimento ou já vencido).",
      code: "renewal_not_available",
    };
  }

  const base = getCanonicalPlanById("brs-drive-1m");
  if (!base) {
    return { ok: false, error: "Plano de renovação indisponível.", code: "renewal_plan_missing" };
  }

  let amountBrl: string;
  try {
    amountBrl = formatAmountBrl(renewable.value);
  } catch {
    return { ok: false, error: "Valor do serviço inválido para cobrança.", code: "invalid_renewal_amount" };
  }

  const plan: CanonicalPlan = {
    ...base,
    amountBrl,
    title: `Renovação ${renewable.label} — 1 mês`,
    description: `Renovação manual do ${renewable.label} com vencimento em ${renewable.dueLabel}. Pagamento único via Mercado Pago.`,
    badge: renewable.urgency === "overdue" ? "Vencido" : "Renovação",
    highlight: true,
    isTestPlan: false,
  };

  return { ok: true, plan, renewable };
}

/** Serialização segura para o client do portal. */
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
