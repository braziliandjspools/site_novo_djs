/**
 * Fonte única de verdade dos planos vendidos via Hotmart (UI + mapeamento interno).
 * URLs/IDs sensíveis de produto ficam em variáveis de ambiente server-side.
 */

export type HotmartBilling = "monthly";

export type HotmartSitePlan = {
  id: "drive-monthly";
  name: string;
  priceLabel: string;
  period: string;
  billing: HotmartBilling;
  badge: string | null;
  highlight: boolean;
  features: string[];
  /** Checkout público (sem secrets). */
  checkoutUrlEnv: "HOTMART_DRIVE_MONTHLY_CHECKOUT_URL" | "NEXT_PUBLIC_HOTMART_DRIVE_MONTHLY_CHECKOUT_URL";
};

/** Preço exibido — override opcional via NEXT_PUBLIC_HOTMART_DRIVE_MONTHLY_PRICE */
export function getDriveMonthlyPriceLabel() {
  const fromEnv = process.env.NEXT_PUBLIC_HOTMART_DRIVE_MONTHLY_PRICE?.trim();
  return fromEnv || "R$ 50";
}

export function getDriveMonthlyPriceNumber() {
  const label = getDriveMonthlyPriceLabel().replace(/[^\d,.]/g, "").replace(",", ".");
  const parsed = Number(label);
  return Number.isFinite(parsed) ? parsed : 50;
}

export const HOTMART_DRIVE_MONTHLY_PLAN = {
  id: "drive-monthly" as const,
  name: "BRS Drive Mensal",
  period: "Cobrança mensal via Hotmart",
  billing: "monthly" as const,
  badge: "Assinatura",
  highlight: true,
  features: [
    "Atualizações mensais",
    "Plataforma para DJs",
    "Packs organizados",
    "Downloader para Windows",
    "Acesso enquanto a assinatura estiver ativa",
  ],
};

export function getHotmartSitePlans(): HotmartSitePlan[] {
  return [
    {
      ...HOTMART_DRIVE_MONTHLY_PLAN,
      priceLabel: getDriveMonthlyPriceLabel(),
      checkoutUrlEnv: "NEXT_PUBLIC_HOTMART_DRIVE_MONTHLY_CHECKOUT_URL",
    },
  ];
}

/** @deprecated use getHotmartSitePlans — mantido para imports legados de SITE_PLANS */
export const SITE_PLANS = getHotmartSitePlans().map((plan) => ({
  name: plan.name,
  price: plan.priceLabel,
  period: plan.period,
  equivalent: null as string | null,
  badge: plan.badge,
  features: plan.features,
  highlight: plan.highlight,
}));
