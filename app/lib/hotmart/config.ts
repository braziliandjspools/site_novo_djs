import { HOTMART_DRIVE_MONTHLY_PLAN, getDriveMonthlyPriceNumber } from "./plans";

export const HOTMART_PROVIDER = "hotmart";

export type HotmartInternalPlanId = typeof HOTMART_DRIVE_MONTHLY_PLAN.id;

export type HotmartProductMapping = {
  planId: HotmartInternalPlanId;
  productId: string;
  offerCode: string;
  checkoutUrl: string;
  displayName: string;
  monthlyValue: number;
};

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Config server-side do produto Drive Mensal. */
export function getHotmartDriveMonthlyMapping(): HotmartProductMapping {
  return {
    planId: HOTMART_DRIVE_MONTHLY_PLAN.id,
    productId: readEnv("HOTMART_DRIVE_MONTHLY_PRODUCT_ID"),
    offerCode: readEnv("HOTMART_DRIVE_MONTHLY_OFFER_CODE"),
    checkoutUrl: "",
    displayName: HOTMART_DRIVE_MONTHLY_PLAN.name,
    monthlyValue: getDriveMonthlyPriceNumber(),
  };
}

export function getHotmartWebhookSecret() {
  return readEnv("HOTMART_WEBHOOK_SECRET", "HOTMART_HOTTOK");
}

export function listHotmartProductMappings(): HotmartProductMapping[] {
  return [getHotmartDriveMonthlyMapping()];
}

/**
 * Resolve plano interno a partir do product id / offer code da Hotmart.
 * Não usa nome comercial.
 */
export function resolveInternalPlan(input: {
  productId?: string | number | null;
  offerCode?: string | null;
}): HotmartProductMapping | null {
  const productId = input.productId != null ? String(input.productId).trim() : "";
  const offerCode = input.offerCode?.trim() ?? "";
  const mappings = listHotmartProductMappings().filter((m) => m.productId || m.offerCode);

  for (const mapping of mappings) {
    if (mapping.productId && productId && mapping.productId === productId) {
      return mapping;
    }
  }

  for (const mapping of mappings) {
    if (mapping.offerCode && offerCode && mapping.offerCode === offerCode) {
      return mapping;
    }
  }

  // Dev/fallback: se só houver um mapeamento com checkout e nenhum ID configurado, não liberar.
  return null;
}
