/**
 * Planos públicos do site — catálogo canônico (servidor).
 * Checkout: POST /api/payments/mercadopago/preference com { planId }.
 */

import { listPublicPlanCards } from "./billing/plan-catalog";

export type SitePlan = {
  id?: string;
  name: string;
  price: string;
  period: string;
  equivalent: string | null;
  badge: string | null;
  features: string[];
  highlight: boolean;
  description?: string;
  durationMonths?: number;
  renewalType?: "manual";
};

/** Planos públicos da /plans — catálogo canônico no servidor. */
export const SITE_PLANS: SitePlan[] = listPublicPlanCards().map((plan) => ({
  id: plan.id,
  name: plan.name,
  price: plan.price,
  period: plan.period,
  equivalent: plan.equivalent,
  badge: plan.badge,
  features: plan.features,
  highlight: plan.highlight,
  description: plan.description,
  durationMonths: plan.durationMonths,
  renewalType: plan.renewalType,
}));

export {
  assertCheckoutPayloadTrusted,
  getCanonicalPlanById,
  listActiveCanonicalPlans,
  listPublicPlanCards,
  resolveCanonicalPlanId,
  type CanonicalPlan,
  type CanonicalPlanId,
} from "./billing/plan-catalog";
