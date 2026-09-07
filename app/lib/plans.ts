import {
  getDriveMonthlyPriceLabel,
  getDriveMonthlyPriceNumber,
  getHotmartSitePlans,
  HOTMART_DRIVE_MONTHLY_PLAN,
  type HotmartBilling,
  type HotmartSitePlan,
} from "./hotmart/plans";

export type SitePlan = {
  id?: string;
  name: string;
  price: string;
  period: string;
  equivalent: string | null;
  badge: string | null;
  features: string[];
  highlight: boolean;
  billing?: HotmartBilling;
};

export {
  getDriveMonthlyPriceLabel,
  getDriveMonthlyPriceNumber,
  getHotmartSitePlans,
  HOTMART_DRIVE_MONTHLY_PLAN,
  type HotmartBilling,
  type HotmartSitePlan,
};

/** Único plano público: BRS Drive Mensal (Hotmart). */
export const SITE_PLANS: SitePlan[] = getHotmartSitePlans().map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: plan.priceLabel,
  period: plan.period,
  equivalent: null,
  badge: plan.badge,
  features: plan.features,
  highlight: plan.highlight,
  billing: plan.billing,
}));
