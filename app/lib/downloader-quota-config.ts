/**
 * Cota do BRS Downloader por plano VIP.
 *
 * STARTER (R$ 38): 1000 faixas/24h OU 1 pack (o que vier primeiro).
 *   Pack com >1000 faixas baixa completo e esgota a janela.
 * PRO (R$ 42): 2000 faixas/24h no Downloader; navegador sem limite.
 * MAX (R$ 46): 4500 faixas / 30 dias.
 */

export type DownloaderQuotaTier = "STARTER" | "PRO" | "MAX";

export const DOWNLOADER_QUOTA_TIERS = ["STARTER", "PRO", "MAX"] as const;

export type DownloaderQuotaLimits = {
  tier: DownloaderQuotaTier;
  label: string;
  /** null = sem limite de faixas (não usado nos planos atuais). */
  trackLimit: number;
  /** Janela em ms (24h ou 30d). */
  windowMs: number;
  /** STARTER: no máx. 1 pack por janela. */
  packLimit: number | null;
  /** PRO+: navegação no site sem cota. */
  browserUnlimited: boolean;
};

export const DOWNLOADER_QUOTA_BY_TIER: Record<DownloaderQuotaTier, DownloaderQuotaLimits> = {
  STARTER: {
    tier: "STARTER",
    label: "Essencial",
    trackLimit: 1000,
    windowMs: 24 * 60 * 60 * 1000,
    packLimit: 1,
    browserUnlimited: false,
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    trackLimit: 2000,
    windowMs: 24 * 60 * 60 * 1000,
    packLimit: null,
    browserUnlimited: true,
  },
  MAX: {
    tier: "MAX",
    label: "Max",
    trackLimit: 4500,
    windowMs: 30 * 24 * 60 * 60 * 1000,
    packLimit: null,
    browserUnlimited: true,
  },
};

/** Mapeia planId do checkout → tier de cota. */
export function quotaTierFromPlanId(planId: string | null | undefined): DownloaderQuotaTier | null {
  if (!planId) return null;
  switch (planId.trim()) {
    case "brs-drive-1m":
    case "brs-drive-3d":
    case "drive-monthly":
      return "STARTER";
    case "brs-drive-pro-1m":
      return "PRO";
    case "brs-drive-max-1m":
      return "MAX";
    // Planos legados trimestral/anual → Pro por padrão
    case "brs-drive-3m":
    case "brs-drive-12m":
      return "PRO";
    default:
      return null;
  }
}

/** Inferência por valor cobrado (admin manual / legado). */
export function quotaTierFromPoolsValue(value: number): DownloaderQuotaTier {
  if (value >= 45) return "MAX";
  if (value >= 40) return "PRO";
  return "STARTER";
}

export function getQuotaLimits(tier: DownloaderQuotaTier): DownloaderQuotaLimits {
  return DOWNLOADER_QUOTA_BY_TIER[tier];
}

export type DownloaderQuotaSnapshot = {
  tier: DownloaderQuotaTier;
  tierLabel: string;
  trackLimit: number;
  tracksUsed: number;
  tracksRemaining: number;
  packsUsed: number;
  packLimit: number | null;
  packsRemaining: number | null;
  windowStartedAt: string;
  windowEndsAt: string;
  resetsInSeconds: number;
  exhausted: boolean;
  browserUnlimited: boolean;
  periodLabel: string;
};

export function buildQuotaSnapshot(input: {
  tier: DownloaderQuotaTier;
  tracksUsed: number;
  packsUsed: number;
  windowStartedAt: Date;
  now?: Date;
}): DownloaderQuotaSnapshot {
  const now = input.now ?? new Date();
  const limits = getQuotaLimits(input.tier);
  const windowEndsAt = new Date(input.windowStartedAt.getTime() + limits.windowMs);
  const resetsInSeconds = Math.max(0, Math.ceil((windowEndsAt.getTime() - now.getTime()) / 1000));
  const tracksRemaining = Math.max(0, limits.trackLimit - input.tracksUsed);
  const packsRemaining =
    limits.packLimit == null ? null : Math.max(0, limits.packLimit - input.packsUsed);

  const exhaustedByTracks = tracksRemaining <= 0;
  const exhaustedByPack =
    limits.packLimit != null && input.packsUsed >= limits.packLimit;
  const exhausted = exhaustedByTracks || exhaustedByPack;

  return {
    tier: input.tier,
    tierLabel: limits.label,
    trackLimit: limits.trackLimit,
    tracksUsed: input.tracksUsed,
    tracksRemaining,
    packsUsed: input.packsUsed,
    packLimit: limits.packLimit,
    packsRemaining,
    windowStartedAt: input.windowStartedAt.toISOString(),
    windowEndsAt: windowEndsAt.toISOString(),
    resetsInSeconds,
    exhausted,
    browserUnlimited: limits.browserUnlimited,
    periodLabel: limits.windowMs >= 7 * 24 * 60 * 60 * 1000 ? "mês" : "24h",
  };
}

export function formatQuotaCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}d ${String(rh).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
