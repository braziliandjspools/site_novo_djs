/**
 * Catálogo canônico de planos BRS — fonte de verdade no servidor.
 * O frontend só pode enviar `planId`. Preço, duração e descrição
 * são sempre resolvidos daqui (nunca confiar no navegador).
 *
 * Não há tabela de planos no Neon; este módulo é a configuração central segura.
 */

export const PLAN_CURRENCY = "BRL" as const;

export type PlanRenewalType = "manual";

export type CanonicalPlanId = "brs-drive-1m" | "brs-drive-3m" | "brs-drive-12m";

/** Alias legado Hotmart → plano canônico de 1 mês. */
export const LEGACY_PLAN_ID_ALIASES: Record<string, CanonicalPlanId> = {
  "drive-monthly": "brs-drive-1m",
};

export type CanonicalPlan = {
  /** Identificador imutável. */
  id: CanonicalPlanId;
  title: string;
  description: string;
  /** Valor total cobrado, string decimal (nunca float). */
  amountBrl: string;
  currency: typeof PLAN_CURRENCY;
  durationMonths: number;
  durationLabel: string;
  active: boolean;
  renewalType: PlanRenewalType;
  badge: string | null;
  highlight: boolean;
  features: string[];
  /** Ex.: "R$ 32,00/mês" — só exibição. */
  equivalentMonthlyLabel: string | null;
};

/**
 * Valores oficiais (pagamentos únicos, renovação manual):
 * - 1 mês: R$ 38,00
 * - 3 meses: 10% off em cada mês → 38 × 3 × 0,9 = R$ 102,60
 * - 1 ano: R$ 32,00/mês → 32 × 12 = R$ 384,00
 */
export const CANONICAL_PLANS: readonly CanonicalPlan[] = [
  {
    id: "brs-drive-1m",
    title: "BRS Drive — 1 mês",
    description: "Acesso VIP completo por 30 dias. Pagamento único com renovação manual.",
    amountBrl: "38.00",
    currency: PLAN_CURRENCY,
    durationMonths: 1,
    durationLabel: "1 mês",
    active: true,
    renewalType: "manual",
    badge: "Popular",
    highlight: true,
    equivalentMonthlyLabel: "R$ 38,00/mês",
    features: [
      "Acervo VIP completo",
      "Plataforma para DJs (/musicas)",
      "Downloader para Windows",
      "Renovação manual ao fim do período",
    ],
  },
  {
    id: "brs-drive-3m",
    title: "BRS Drive — 3 meses",
    description: "Trimestral com 10% de desconto em cada mês. Pagamento único com renovação manual.",
    amountBrl: "102.60",
    currency: PLAN_CURRENCY,
    durationMonths: 3,
    durationLabel: "3 meses",
    active: true,
    renewalType: "manual",
    badge: "10% off",
    highlight: false,
    equivalentMonthlyLabel: "R$ 34,20/mês",
    features: [
      "Acervo VIP completo",
      "Plataforma para DJs (/musicas)",
      "Downloader para Windows",
      "Economia de 10% vs. mensal",
      "Renovação manual ao fim do período",
    ],
  },
  {
    id: "brs-drive-12m",
    title: "BRS Drive — 1 ano",
    description: "Anual equivalente a R$ 32,00 por mês. Pagamento único com renovação manual.",
    amountBrl: "384.00",
    currency: PLAN_CURRENCY,
    durationMonths: 12,
    durationLabel: "12 meses",
    active: true,
    renewalType: "manual",
    badge: "Melhor valor",
    highlight: false,
    equivalentMonthlyLabel: "R$ 32,00/mês",
    features: [
      "Acervo VIP completo",
      "Plataforma para DJs (/musicas)",
      "Downloader para Windows",
      "Menor custo mensal equivalente",
      "Renovação manual ao fim do período",
    ],
  },
] as const;

export function formatPlanAmountBrl(amountBrl: string): string {
  const normalized = amountBrl.trim().replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Valor de plano inválido: ${amountBrl}`);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function resolveCanonicalPlanId(planId: string): CanonicalPlanId | null {
  const trimmed = planId.trim();
  if (!trimmed) return null;
  if (trimmed in LEGACY_PLAN_ID_ALIASES) {
    return LEGACY_PLAN_ID_ALIASES[trimmed] ?? null;
  }
  const found = CANONICAL_PLANS.find((plan) => plan.id === trimmed);
  return found?.id ?? null;
}

/** Resolve plano ativo pelo id (ou alias legado). Ignora qualquer preço vindo do cliente. */
export function getCanonicalPlanById(planId: string): CanonicalPlan | null {
  const id = resolveCanonicalPlanId(planId);
  if (!id) return null;
  const plan = CANONICAL_PLANS.find((item) => item.id === id) ?? null;
  if (!plan || !plan.active) return null;
  return plan;
}

export function listActiveCanonicalPlans(): CanonicalPlan[] {
  return CANONICAL_PLANS.filter((plan) => plan.active);
}

/**
 * DTO seguro para UI: o cliente recebe preço já resolvido no servidor,
 * mas o checkout só deve reenviar `planId`.
 */
export type PublicPlanCard = {
  id: CanonicalPlanId;
  name: string;
  price: string;
  period: string;
  equivalent: string | null;
  badge: string | null;
  features: string[];
  highlight: boolean;
  description: string;
  durationMonths: number;
  renewalType: PlanRenewalType;
};

export function toPublicPlanCard(plan: CanonicalPlan): PublicPlanCard {
  return {
    id: plan.id,
    name: plan.title,
    price: formatPlanAmountBrl(plan.amountBrl),
    period: `${plan.durationLabel} · renovação manual`,
    equivalent: plan.equivalentMonthlyLabel,
    badge: plan.badge,
    features: [...plan.features],
    highlight: plan.highlight,
    description: plan.description,
    durationMonths: plan.durationMonths,
    renewalType: plan.renewalType,
  };
}

export function listPublicPlanCards(): PublicPlanCard[] {
  return listActiveCanonicalPlans().map(toPublicPlanCard);
}

/**
 * Valida que um payload de checkout não tenta impor preço/duração.
 * Aceita apenas planId; campos extras de valor são rejeitados.
 */
export function assertCheckoutPayloadTrusted(input: {
  planId?: unknown;
  amount?: unknown;
  amountBrl?: unknown;
  price?: unknown;
  durationMonths?: unknown;
  duration?: unknown;
}): { ok: true; plan: CanonicalPlan } | { ok: false; error: string } {
  if (typeof input.planId !== "string" || !input.planId.trim()) {
    return { ok: false, error: "Informe apenas o planId do catálogo." };
  }

  const forbidden = ["amount", "amountBrl", "price", "durationMonths", "duration"] as const;
  for (const key of forbidden) {
    if (input[key] !== undefined && input[key] !== null) {
      return {
        ok: false,
        error: "Preço e duração não podem ser enviados pelo cliente. Envie somente planId.",
      };
    }
  }

  const plan = getCanonicalPlanById(input.planId);
  if (!plan) {
    return { ok: false, error: "Plano inválido ou inativo." };
  }

  return { ok: true, plan };
}
