/**
 * Mapeamento Hotmart legado — preços canônicos em `app/lib/billing/plan-catalog.ts`.
 * Mantido apenas para webhooks de assinantes existentes (`drive-monthly`).
 */

import {
  formatPlanAmountBrl,
  getCanonicalPlanById,
  type CanonicalPlanId,
} from "../billing/plan-catalog";

export type HotmartBilling = "monthly";

export function getDriveMonthlyPriceLabel() {
  const plan = getCanonicalPlanById("brs-drive-1m");
  return plan ? formatPlanAmountBrl(plan.amountBrl) : "R$ 38,00";
}

export function getDriveMonthlyPriceNumber() {
  const plan = getCanonicalPlanById("brs-drive-1m");
  return plan ? Number(plan.amountBrl) : 38;
}

export const HOTMART_DRIVE_MONTHLY_PLAN = {
  id: "drive-monthly" as const,
  canonicalId: "brs-drive-1m" as CanonicalPlanId,
  name: "BRS Drive — 1 mês",
  period: "1 mês · renovação manual",
  billing: "monthly" as const,
  badge: "Popular" as string | null,
  highlight: true,
  features: [
    "Acervo VIP completo",
    "Plataforma para DJs (/musicas)",
    "Downloader para Windows",
    "Renovação manual ao fim do período",
  ],
};
