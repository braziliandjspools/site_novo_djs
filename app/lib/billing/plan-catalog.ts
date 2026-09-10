/**
 * Catálogo canônico de planos BRS — fonte de verdade no servidor.
 * O frontend só pode enviar `planId`. Preço, duração e descrição
 * são sempre resolvidos daqui (nunca confiar no navegador).
 */

export const PLAN_CURRENCY = "BRL" as const;

export type PlanRenewalType = "manual";

export type PlanServiceProduct = "poolsVip" | "deemix";

export type CanonicalPlanId =
  | "brs-drive-3d"
  | "brs-drive-1m"
  | "brs-drive-3m"
  | "brs-drive-12m"
  | "brs-deemix-1m"
  | "brs-deemix-3m"
  | "brs-deemix-6m";

/** Alias legado Hotmart → plano canônico de 1 mês. */
export const LEGACY_PLAN_ID_ALIASES: Record<string, CanonicalPlanId> = {
  "drive-monthly": "brs-drive-1m",
};

export type CanonicalPlan = {
  id: CanonicalPlanId;
  title: string;
  description: string;
  /** Valor total cobrado, string decimal (nunca float). */
  amountBrl: string;
  currency: typeof PLAN_CURRENCY;
  /**
   * Duração em dias (fonte para liberação de acesso).
   * Planos mensais usam 30/90/365; teste usa 3.
   */
  durationDays: number;
  /** Compat UI/legado — 0 no plano de teste. */
  durationMonths: number;
  durationLabel: string;
  active: boolean;
  renewalType: PlanRenewalType;
  badge: string | null;
  highlight: boolean;
  /** Plano de teste production (valor baixo, duração curta). */
  isTestPlan: boolean;
  /** Serviço liberado no portal ao aprovar o pagamento. */
  serviceProduct: PlanServiceProduct;
  features: string[];
  equivalentMonthlyLabel: string | null;
};

/**
 * Valores oficiais (pagamentos únicos, renovação manual):
 * Drive VIP:
 * - Teste 3 dias: R$ 1,00
 * - 1 mês: R$ 38,00 (~30 dias)
 * - 3 meses: 10% off → R$ 102,60 (~90 dias)
 * - 1 ano: R$ 32,00/mês → R$ 384,00 (~365 dias)
 * Deemix (ARL 320 kbps):
 * - 1 mês: R$ 30,00 (~30 dias)
 * - 90 dias: 10% off → R$ 81,00
 * - 180 dias: 10% off → R$ 162,00
 */
export const CANONICAL_PLANS: readonly CanonicalPlan[] = [
  {
    id: "brs-drive-3d",
    title: "BRS Drive — Teste 3 dias",
    description:
      "Plano de teste em produção no Mercado Pago. Acesso VIP completo por 3 dias para validar checkout, webhook e liberação automática.",
    amountBrl: "1.00",
    currency: PLAN_CURRENCY,
    durationDays: 3,
    durationMonths: 0,
    durationLabel: "3 dias",
    active: true,
    renewalType: "manual",
    badge: "Teste",
    highlight: false,
    isTestPlan: true,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: null,
    features: [
      "Acesso VIP completo por 3 dias",
      "Mesmo fluxo de pagamento dos planos oficiais",
      "Libera plataforma + Downloader",
      "Ideal para validar produção Mercado Pago",
    ],
  },
  {
    id: "brs-drive-1m",
    title: "BRS Drive — 1 mês",
    description: "Acesso VIP completo por 30 dias. Pagamento único com renovação manual.",
    amountBrl: "38.00",
    currency: PLAN_CURRENCY,
    durationDays: 30,
    durationMonths: 1,
    durationLabel: "1 mês",
    active: true,
    renewalType: "manual",
    badge: "Popular",
    highlight: true,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: "R$ 38,00/mês",
    features: [
      "Acervo VIP completo (+315 GB)",
      "Plataforma para DJs (/musicas)",
      "Downloader para Windows",
      "Atualizações mensais",
      "Renovação manual ao fim do período",
    ],
  },
  {
    id: "brs-drive-3m",
    title: "BRS Drive — 3 meses",
    description: "Trimestral com 10% de desconto em cada mês. Pagamento único com renovação manual.",
    amountBrl: "102.60",
    currency: PLAN_CURRENCY,
    durationDays: 90,
    durationMonths: 3,
    durationLabel: "3 meses",
    active: true,
    renewalType: "manual",
    badge: "10% off",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: "R$ 34,20/mês",
    features: [
      "Acervo VIP completo (+315 GB)",
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
    durationDays: 365,
    durationMonths: 12,
    durationLabel: "12 meses",
    active: true,
    renewalType: "manual",
    badge: "Melhor valor",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: "R$ 32,00/mês",
    features: [
      "Acervo VIP completo (+315 GB)",
      "Plataforma para DJs (/musicas)",
      "Downloader para Windows",
      "Menor custo mensal equivalente",
      "Renovação manual ao fim do período",
    ],
  },
  {
    id: "brs-deemix-1m",
    title: "Deemix — 1 mês",
    description: "Acesso Deemix com ARL 320 kbps por 30 dias. Pagamento único via Mercado Pago.",
    amountBrl: "30.00",
    currency: PLAN_CURRENCY,
    durationDays: 30,
    durationMonths: 1,
    durationLabel: "1 mês",
    active: true,
    renewalType: "manual",
    badge: "ARL 320",
    highlight: true,
    isTestPlan: false,
    serviceProduct: "deemix",
    equivalentMonthlyLabel: "R$ 30,00/mês",
    features: [
      "ARL Premium 320 kbps",
      "Credenciais no portal do cliente",
      "Download de faixas, álbuns e playlists",
      "Renovação manual ao fim do período",
    ],
  },
  {
    id: "brs-deemix-3m",
    title: "Deemix — 90 dias",
    description: "90 dias de Deemix (ARL 320) com 10% de desconto. Pagamento único via Mercado Pago.",
    amountBrl: "81.00",
    currency: PLAN_CURRENCY,
    durationDays: 90,
    durationMonths: 3,
    durationLabel: "90 dias",
    active: true,
    renewalType: "manual",
    badge: "10% off",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "deemix",
    equivalentMonthlyLabel: "R$ 27,00/mês",
    features: [
      "ARL Premium 320 kbps",
      "90 dias de acesso",
      "Economia de 10% vs. mensal",
      "Credenciais no portal do cliente",
      "Renovação manual ao fim do período",
    ],
  },
  {
    id: "brs-deemix-6m",
    title: "Deemix — 180 dias",
    description: "180 dias de Deemix (ARL 320) com 10% de desconto. Pagamento único via Mercado Pago.",
    amountBrl: "162.00",
    currency: PLAN_CURRENCY,
    durationDays: 180,
    durationMonths: 6,
    durationLabel: "180 dias",
    active: true,
    renewalType: "manual",
    badge: "10% off",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "deemix",
    equivalentMonthlyLabel: "R$ 27,00/mês",
    features: [
      "ARL Premium 320 kbps",
      "180 dias de acesso",
      "Economia de 10% vs. mensal",
      "Credenciais no portal do cliente",
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

export function listCanonicalPlansByProduct(product: PlanServiceProduct): CanonicalPlan[] {
  return listActiveCanonicalPlans().filter((plan) => plan.serviceProduct === product);
}

export function isDeemixPlanId(planId: string): boolean {
  return getCanonicalPlanById(planId)?.serviceProduct === "deemix";
}

export function isPoolsVipPlanId(planId: string): boolean {
  return getCanonicalPlanById(planId)?.serviceProduct === "poolsVip";
}

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
  durationDays: number;
  durationMonths: number;
  renewalType: PlanRenewalType;
  isTestPlan: boolean;
  serviceProduct: PlanServiceProduct;
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
    durationDays: plan.durationDays,
    durationMonths: plan.durationMonths,
    renewalType: plan.renewalType,
    isTestPlan: plan.isTestPlan,
    serviceProduct: plan.serviceProduct,
  };
}

export function listPublicPlanCards(product?: PlanServiceProduct): PublicPlanCard[] {
  const plans = product ? listCanonicalPlansByProduct(product) : listActiveCanonicalPlans();
  return plans.map(toPublicPlanCard);
}

export function assertCheckoutPayloadTrusted(input: {
  planId?: unknown;
  amount?: unknown;
  amountBrl?: unknown;
  price?: unknown;
  durationMonths?: unknown;
  durationDays?: unknown;
  duration?: unknown;
}): { ok: true; plan: CanonicalPlan } | { ok: false; error: string } {
  if (typeof input.planId !== "string" || !input.planId.trim()) {
    return { ok: false, error: "Informe apenas o planId do catálogo." };
  }

  const forbidden = ["amount", "amountBrl", "price", "durationMonths", "durationDays", "duration"] as const;
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
