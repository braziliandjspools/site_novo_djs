import type { CanonicalPlan } from "../billing/plan-catalog";

export type PreferenceCheckoutMode = "test" | "production";

export const MERCADO_PAGO_NOTIFICATION_URL =
  "https://www.brazilianremixservice.com.br/api/webhooks/mercadopago";

export type PreferencePayer = {
  id: number;
  email: string;
  name: string;
};

export type MercadoPagoPreferenceBody = {
  items: Array<{
    id: string;
    title: string;
    description: string;
    quantity: number;
    unit_price: number;
    currency_id: "BRL";
  }>;
  payer: { email: string; name: string };
  external_reference: string;
  back_urls: { success: string; pending: string; failure: string };
  auto_return: "approved";
  notification_url: string;
  metadata: Record<string, string>;
};

/** Monta o body da Preference (testável sem chamar a API). */
export function buildMercadoPagoPreferenceBody(input: {
  plan: CanonicalPlan;
  externalReference: string;
  siteUrl: string;
  payer: PreferencePayer;
}): MercadoPagoPreferenceBody {
  const base = input.siteUrl.replace(/\/$/, "");
  if (!base.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_SITE_URL deve usar HTTPS para back_urls do Checkout Pro.");
  }

  const unitPrice = Number(input.plan.amountBrl);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new Error("Preço do plano inválido no catálogo.");
  }

  return {
    items: [
      {
        id: input.plan.id,
        title: input.plan.title,
        description: input.plan.description,
        quantity: 1,
        unit_price: unitPrice,
        currency_id: "BRL",
      },
    ],
    payer: {
      email: input.payer.email,
      name: input.payer.name,
    },
    external_reference: input.externalReference,
    back_urls: {
      success: `${base}/pagamento/sucesso`,
      pending: `${base}/pagamento/pendente`,
      failure: `${base}/pagamento/erro`,
    },
    auto_return: "approved",
    notification_url: MERCADO_PAGO_NOTIFICATION_URL,
    metadata: {
      brs_plan_id: input.plan.id,
      brs_portal_user_id: String(input.payer.id),
      brs_duration_months: String(input.plan.durationMonths),
    },
  };
}

export function resolveCheckoutUrl(input: {
  mode: PreferenceCheckoutMode;
  initPoint?: string | null;
  sandboxInitPoint?: string | null;
}): string | null {
  const url =
    input.mode === "test"
      ? input.sandboxInitPoint?.trim() || input.initPoint?.trim() || null
      : input.initPoint?.trim() || null;
  return url || null;
}

/** Remove possíveis vazamentos de token em mensagens de erro. */
export function sanitizeMercadoPagoErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : "Falha ao criar preferência.";
  return raw
    .replace(/APP_USR-[A-Za-z0-9-]+/gi, "[redacted]")
    .replace(/TEST-[A-Za-z0-9-]+/gi, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 280);
}
