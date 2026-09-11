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
  durationDays?: number;
  durationMonths?: number;
  renewalType?: "manual";
  isTestPlan?: boolean;
  lifetime?: boolean;
  serviceProduct?: "poolsVip" | "deemix" | "allavsoft";
};

function mapCards(product?: "poolsVip" | "deemix" | "allavsoft"): SitePlan[] {
  return listPublicPlanCards(product).map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    equivalent: plan.equivalent,
    badge: plan.badge,
    features: plan.features,
    highlight: plan.highlight,
    description: plan.description,
    durationDays: plan.durationDays,
    durationMonths: plan.durationMonths,
    renewalType: plan.renewalType,
    isTestPlan: plan.isTestPlan,
    lifetime: plan.lifetime,
    serviceProduct: plan.serviceProduct,
  }));
}

/** Planos públicos Drive VIP (Allavsoft em /allavsoft; Deemix descontinuado). */
export const SITE_PLANS: SitePlan[] = mapCards();

/** Só Drive VIP. */
export const SITE_DRIVE_PLANS: SitePlan[] = mapCards("poolsVip");

/** Deemix descontinuado — lista vazia. */
export const SITE_DEEMIX_PLANS: SitePlan[] = mapCards("deemix");

/** Só Allavsoft. */
export const SITE_ALLAVSOFT_PLANS: SitePlan[] = mapCards("allavsoft");

export {
  assertCheckoutPayloadTrusted,
  getCanonicalPlanById,
  listActiveCanonicalPlans,
  listCanonicalPlansByProduct,
  listPublicPlanCards,
  resolveCanonicalPlanId,
  type CanonicalPlan,
  type CanonicalPlanId,
  type PlanServiceProduct,
} from "./billing/plan-catalog";
