import { SITE_PRODUCTION_URL } from "../branding";
import type { CanonicalPlan } from "../billing/plan-catalog";

export type PreferenceCheckoutMode = "test" | "production";

export const MERCADO_PAGO_NOTIFICATION_URL =
  `${SITE_PRODUCTION_URL}/api/webhooks/mercadopago`;

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

/** Hosts que nunca podem ir para back_urls / retorno do Checkout Pro. */
export function isUnsafeMercadoPagoCheckoutHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  );
}

/**
 * Normaliza a URL do site para back_urls.
 * Em production, localhost/http privado caem no domínio canônico
 * (evita retorno pós-pagamento em https://localhost quando o Dokploy
 * herda NEXT_PUBLIC_SITE_URL/SITE_URL de desenvolvimento).
 */
export function resolveMercadoPagoCheckoutSiteUrl(input: {
  mode: PreferenceCheckoutMode;
  configuredUrl?: string | null;
  fallbackUrl?: string;
}): string {
  const fallback = (input.fallbackUrl ?? SITE_PRODUCTION_URL).replace(/\/+$/, "");

  const raw = input.configuredUrl?.trim() ?? "";
  if (!raw) {
    if (input.mode === "production") return fallback;
    throw new Error(
      "NEXT_PUBLIC_SITE_URL ausente. Defina um HTTPS público ou use MERCADO_PAGO_MODE=production.",
    );
  }

  let value = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value.replace(/^\/+/, "")}`;
  } else if (/^http:\/\//i.test(value)) {
    value = `https://${value.slice("http://".length)}`;
  }
  value = value.replace(/\/+$/, "");

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    if (input.mode === "production") return fallback;
    throw new Error("NEXT_PUBLIC_SITE_URL inválida.");
  }

  if (isUnsafeMercadoPagoCheckoutHost(hostname)) {
    if (input.mode === "production") return fallback;
    throw new Error(
      "NEXT_PUBLIC_SITE_URL não pode ser localhost no Checkout Pro. Use um HTTPS público (ex.: ngrok) ou o domínio de produção.",
    );
  }

  if (!value.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_SITE_URL deve usar HTTPS para back_urls do Checkout Pro.");
  }

  return value;
}

/** Monta o body da Preference (testável sem chamar a API). */
export function buildMercadoPagoPreferenceBody(input: {
  plan: CanonicalPlan;
  externalReference: string;
  siteUrl: string;
  payer: PreferencePayer;
  checkoutKind?: "new" | "renewal" | "plan_change";
  creditBrl?: string;
  catalogAmountBrl?: string;
  previousDueAt?: Date;
}): MercadoPagoPreferenceBody {
  const base = input.siteUrl.replace(/\/$/, "");
  if (!base.startsWith("https://")) {
    throw new Error("NEXT_PUBLIC_SITE_URL deve usar HTTPS para back_urls do Checkout Pro.");
  }

  let hostname: string;
  try {
    hostname = new URL(base).hostname;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL inválida.");
  }
  if (isUnsafeMercadoPagoCheckoutHost(hostname)) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL não pode ser localhost para back_urls do Checkout Pro.",
    );
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
      brs_duration_days: String(input.plan.durationDays),
      brs_duration_months: String(input.plan.durationMonths),
      brs_service_product: input.plan.serviceProduct,
      ...(input.checkoutKind ? { brs_checkout_kind: input.checkoutKind } : {}),
      ...(input.creditBrl ? { brs_credit_brl: input.creditBrl } : {}),
      ...(input.catalogAmountBrl ? { brs_catalog_amount_brl: input.catalogAmountBrl } : {}),
      ...(input.previousDueAt
        ? { brs_previous_due_at: input.previousDueAt.toISOString() }
        : {}),
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
