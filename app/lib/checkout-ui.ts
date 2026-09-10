/**
 * Helpers puros do checkout em /plans (sem React).
 * O frontend só envia planId; preço e aprovação ficam no servidor.
 */

export type PlanIdCard = { id: string };

/** Resolve planId de query `?checkout=` (inclui alias legado). */
export function resolveCheckoutPlanId(checkout: string, plans: PlanIdCard[]) {
  if (checkout === "drive-monthly") {
    return plans.find((p) => p.id === "brs-drive-1m")?.id ?? null;
  }
  return plans.some((plan) => plan.id === checkout) ? checkout : null;
}

export function friendlyCheckoutError(status: number, apiError?: string) {
  if (apiError?.trim()) return apiError.trim();
  if (status === 429) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  if (status === 503) {
    return "Checkout ainda não configurado. Peça ao administrador para definir as variáveis na Vercel.";
  }
  if (status >= 500) return "Não foi possível preparar o pagamento agora. Tente novamente em instantes.";
  return "Não foi possível abrir o checkout. Tente novamente.";
}
