import { getPublicHotmartCheckoutUrl } from "./config";

export type HotmartCheckoutUser = {
  id: number;
  email: string;
  name: string;
};

/**
 * Monta URL de checkout Hotmart com identificação do usuário BRS.
 * xcod = brs_user_id (referência externa sem dados sensíveis).
 */
export function buildHotmartCheckoutUrl(planId: string, user: HotmartCheckoutUser) {
  const base = getPublicHotmartCheckoutUrl(planId);
  if (!base) return "";

  const url = new URL(base);
  url.searchParams.set("email", user.email);
  url.searchParams.set("name", user.name);
  url.searchParams.set("xcod", `brs_user_id=${user.id}`);
  url.searchParams.set("sck", `brs_user_id=${user.id}`);
  url.searchParams.set("src", "brs_plans");
  return url.toString();
}
