/**
 * Catálogo canônico de planos BRS — fonte de verdade no servidor.
 * O frontend só pode enviar `planId`. Preço, duração e descrição
 * são sempre resolvidos daqui (nunca confiar no navegador).
 */

export const PLAN_CURRENCY = "BRL" as const;

export type PlanRenewalType = "manual";

export type PlanServiceProduct = "poolsVip" | "deemix" | "allavsoft";

export type CanonicalPlanId =
  | "brs-drive-3d"
  | "brs-drive-1m"
  | "brs-drive-3m"
  | "brs-drive-6m"
  | "brs-drive-pro-1m"
  | "brs-drive-max-1m"
  | "brs-drive-12m"
  | "brs-deemix-1m"
  | "brs-deemix-3m"
  | "brs-deemix-6m"
  | "brs-allavsoft-lifetime";

/** Alias legado Hotmart → plano mensal. */
export const LEGACY_PLAN_ID_ALIASES: Record<string, CanonicalPlanId> = {
  "drive-monthly": "brs-drive-1m",
};

/** Planos VIP de assinatura (upgrade/downgrade no portal). */
export const PORTAL_SUBSCRIPTION_PLAN_IDS = [
  "brs-drive-1m",
  "brs-drive-3m",
  "brs-drive-6m",
] as const;

export type PortalSubscriptionPlanId = (typeof PORTAL_SUBSCRIPTION_PLAN_IDS)[number];

export type CanonicalPlan = {
  id: CanonicalPlanId;
  title: string;
  description: string;
  /** Valor total cobrado, string decimal (nunca float). */
  amountBrl: string;
  currency: typeof PLAN_CURRENCY;
  durationDays: number;
  durationMonths: number;
  durationLabel: string;
  lifetime: boolean;
  active: boolean;
  renewalType: PlanRenewalType;
  badge: string | null;
  highlight: boolean;
  isTestPlan: boolean;
  serviceProduct: PlanServiceProduct;
  features: string[];
  equivalentMonthlyLabel: string | null;
};

/**
 * Valores oficiais (pagamentos únicos, renovação manual):
 * Drive VIP:
 * - Teste 3 dias: R$ 3,50 (uma vez por conta)
 * - Mensal: R$ 35,50 (~30 dias)
 * - Trimestral: R$ 100,00 (~90 dias)
 * - Semestral: R$ 200,00 (~180 dias)
 * Allavsoft: R$ 50,00 vitalícia
 */
export const CANONICAL_PLANS: readonly CanonicalPlan[] = [
  {
    id: "brs-drive-3d",
    title: "BRS Drive — Plano Teste",
    description:
      "Acesso VIP completo por 3 dias. Disponível uma única vez por conta — depois, escolha mensal, trimestral ou semestral.",
    amountBrl: "3.50",
    currency: PLAN_CURRENCY,
    durationDays: 3,
    durationMonths: 0,
    durationLabel: "3 dias",
    lifetime: false,
    active: true,
    renewalType: "manual",
    badge: "Teste",
    highlight: false,
    isTestPlan: true,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: null,
    features: [
      "Acesso VIP completo por 3 dias",
      "Plataforma /musicas + BRS Downloader",
      "Só pode ser ativado uma vez por conta",
      "Para continuar, escolha 1, 3 ou 6 meses",
    ],
  },
  {
    id: "brs-drive-1m",
    title: "BRS Drive — Mensal",
    description: "Acesso VIP completo por 30 dias. Pagamento único com renovação manual.",
    amountBrl: "35.50",
    currency: PLAN_CURRENCY,
    durationDays: 30,
    durationMonths: 1,
    durationLabel: "1 mês",
    lifetime: false,
    active: true,
    renewalType: "manual",
    badge: "Mensal",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: "R$ 35,50/mês",
    features: [
      "Acervo VIP completo (+315 GB)",
      "Plataforma para DJs (/musicas)",
      "BRS Downloader para Windows",
      "Atualizações contínuas",
      "Renovação ou troca de plano no portal",
    ],
  },
  {
    id: "brs-drive-3m",
    title: "BRS Drive — Trimestral",
    description: "Acesso VIP completo por 90 dias. Pagamento único com renovação manual.",
    amountBrl: "100.00",
    currency: PLAN_CURRENCY,
    durationDays: 90,
    durationMonths: 3,
    durationLabel: "3 meses",
    lifetime: false,
    active: true,
    renewalType: "manual",
    badge: "Trimestral",
    highlight: true,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: "R$ 33,33/mês equiv.",
    features: [
      "Acervo VIP completo (+315 GB)",
      "Plataforma para DJs (/musicas)",
      "BRS Downloader para Windows",
      "90 dias de acesso",
      "Renovação ou troca de plano no portal",
    ],
  },
  {
    id: "brs-drive-6m",
    title: "BRS Drive — Semestral",
    description: "Acesso VIP completo por 180 dias. Pagamento único com renovação manual.",
    amountBrl: "200.00",
    currency: PLAN_CURRENCY,
    durationDays: 180,
    durationMonths: 6,
    durationLabel: "6 meses",
    lifetime: false,
    active: true,
    renewalType: "manual",
    badge: "Semestral",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: "R$ 33,33/mês equiv.",
    features: [
      "Acervo VIP completo (+315 GB)",
      "Plataforma para DJs (/musicas)",
      "BRS Downloader para Windows",
      "180 dias de acesso",
      "Renovação ou troca de plano no portal",
    ],
  },
  {
    id: "brs-drive-pro-1m",
    title: "BRS Drive — Pro (legado)",
    description: "Plano legado — não listado no checkout.",
    amountBrl: "42.00",
    currency: PLAN_CURRENCY,
    durationDays: 30,
    durationMonths: 1,
    durationLabel: "1 mês",
    lifetime: false,
    active: false,
    renewalType: "manual",
    badge: null,
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: null,
    features: ["Plano legado"],
  },
  {
    id: "brs-drive-max-1m",
    title: "BRS Drive — Max (legado)",
    description: "Plano legado — não listado no checkout.",
    amountBrl: "46.00",
    currency: PLAN_CURRENCY,
    durationDays: 30,
    durationMonths: 1,
    durationLabel: "1 mês",
    lifetime: false,
    active: false,
    renewalType: "manual",
    badge: null,
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: null,
    features: ["Plano legado"],
  },
  {
    id: "brs-drive-12m",
    title: "BRS Drive — 1 ano (legado)",
    description: "Plano anual legado — não listado no checkout.",
    amountBrl: "384.00",
    currency: PLAN_CURRENCY,
    durationDays: 365,
    durationMonths: 12,
    durationLabel: "12 meses",
    lifetime: false,
    active: false,
    renewalType: "manual",
    badge: null,
    highlight: false,
    isTestPlan: false,
    serviceProduct: "poolsVip",
    equivalentMonthlyLabel: null,
    features: ["Plano legado"],
  },
  {
    id: "brs-deemix-1m",
    title: "Deemix — 1 mês",
    description: "Acesso Deemix com ARL 320 kbps por 30 dias.",
    amountBrl: "30.00",
    currency: PLAN_CURRENCY,
    durationDays: 30,
    durationMonths: 1,
    durationLabel: "1 mês",
    lifetime: false,
    active: false,
    renewalType: "manual",
    badge: "ARL 320",
    highlight: false,
    isTestPlan: false,
    serviceProduct: "deemix",
    equivalentMonthlyLabel: "R$ 30,00/mês",
    features: ["Plano legado"],
  },
  {
    id: "brs-deemix-3m",
    title: "Deemix — 90 dias",
    description: "90 dias de Deemix (ARL 320).",
    amountBrl: "81.00",
    currency: PLAN_CURRENCY,
    durationDays: 90,
    durationMonths: 3,
    durationLabel: "90 dias",
    lifetime: false,
    active: false,
    renewalType: "manual",
    badge: null,
    highlight: false,
    isTestPlan: false,
    serviceProduct: "deemix",
    equivalentMonthlyLabel: null,
    features: ["Plano legado"],
  },
  {
    id: "brs-deemix-6m",
    title: "Deemix — 180 dias",
    description: "180 dias de Deemix (ARL 320).",
    amountBrl: "162.00",
    currency: PLAN_CURRENCY,
    durationDays: 180,
    durationMonths: 6,
    durationLabel: "180 dias",
    lifetime: false,
    active: false,
    renewalType: "manual",
    badge: null,
    highlight: false,
    isTestPlan: false,
    serviceProduct: "deemix",
    equivalentMonthlyLabel: null,
    features: ["Plano legado"],
  },
  {
    id: "brs-allavsoft-lifetime",
    title: "Allavsoft — Licença vitalícia",
    description:
      "Licença vitalícia do Allavsoft. Baixe de Deezer, Spotify, YouTube e +1000 sites. Pagamento único de R$ 50,00.",
    amountBrl: "50.00",
    currency: PLAN_CURRENCY,
    durationDays: 0,
    durationMonths: 0,
    durationLabel: "vitalícia",
    lifetime: true,
    active: true,
    renewalType: "manual",
    badge: "Vitalícia",
    highlight: true,
    isTestPlan: false,
    serviceProduct: "allavsoft",
    equivalentMonthlyLabel: null,
    features: [
      "Licença vitalícia (pagamento único)",
      "Deezer, Spotify, YouTube e +1000 sites",
      "Download e conversão de vídeos e áudios",
      "Serial no portal do cliente após o pagamento",
      "Liberação automática após confirmação do pagamento",
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

export function getCanonicalPlanById(
  planId: string,
  options?: { includeInactive?: boolean },
): CanonicalPlan | null {
  const id = resolveCanonicalPlanId(planId);
  if (!id) return null;
  const plan = CANONICAL_PLANS.find((item) => item.id === id) ?? null;
  if (!plan) return null;
  if (!plan.active && !options?.includeInactive) return null;
  return plan;
}

export function listActiveCanonicalPlans(): CanonicalPlan[] {
  return CANONICAL_PLANS.filter((plan) => plan.active);
}

export function listCanonicalPlansByProduct(product: PlanServiceProduct): CanonicalPlan[] {
  return listActiveCanonicalPlans().filter((plan) => plan.serviceProduct === product);
}

export function listPortalSubscriptionPlans(): CanonicalPlan[] {
  return PORTAL_SUBSCRIPTION_PLAN_IDS.map((id) => getCanonicalPlanById(id)).filter(
    (plan): plan is CanonicalPlan => Boolean(plan),
  );
}

export function isPortalSubscriptionPlanId(planId: string): planId is PortalSubscriptionPlanId {
  return (PORTAL_SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(planId);
}

export function isDeemixPlanId(planId: string): boolean {
  return getCanonicalPlanById(planId, { includeInactive: true })?.serviceProduct === "deemix";
}

export function isPoolsVipPlanId(planId: string): boolean {
  return getCanonicalPlanById(planId, { includeInactive: true })?.serviceProduct === "poolsVip";
}

export function isAllavsoftPlanId(planId: string): boolean {
  return getCanonicalPlanById(planId, { includeInactive: true })?.serviceProduct === "allavsoft";
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
  lifetime: boolean;
  serviceProduct: PlanServiceProduct;
};

export function toPublicPlanCard(plan: CanonicalPlan): PublicPlanCard {
  return {
    id: plan.id,
    name: plan.title,
    price: formatPlanAmountBrl(plan.amountBrl),
    period: plan.lifetime
      ? "Licença vitalícia · pagamento único"
      : `${plan.durationLabel} · renovação manual`,
    equivalent: plan.equivalentMonthlyLabel,
    badge: plan.badge,
    features: [...plan.features],
    highlight: plan.highlight,
    description: plan.description,
    durationDays: plan.durationDays,
    durationMonths: plan.durationMonths,
    renewalType: plan.renewalType,
    isTestPlan: plan.isTestPlan,
    lifetime: plan.lifetime,
    serviceProduct: plan.serviceProduct,
  };
}

export function listPublicPlanCards(product?: PlanServiceProduct): PublicPlanCard[] {
  const plans = product
    ? listCanonicalPlansByProduct(product)
    : listActiveCanonicalPlans().filter((plan) => plan.serviceProduct !== "allavsoft");
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
