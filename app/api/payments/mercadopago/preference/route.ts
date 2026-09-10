import { NextResponse } from "next/server";
import { assertCheckoutPayloadTrusted } from "../../../../lib/billing/plan-catalog";
import { formatDueDate } from "../../../../lib/due-queue";
import { diagnoseMercadoPagoEnv } from "../../../../lib/mercadopago/env";
import {
  createMercadoPagoCheckoutPreference,
  sanitizeMercadoPagoErrorMessage,
} from "../../../../lib/mercadopago/preference";
import { userHasActiveVipAccess } from "../../../../lib/mercadopago/webhook-policy";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { checkRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

type PreferenceBody = {
  planId?: unknown;
  amount?: unknown;
  amountBrl?: unknown;
  price?: unknown;
  durationMonths?: unknown;
  duration?: unknown;
};

function classifyPreferenceError(message: string): {
  status: number;
  error: string;
  code: string;
} {
  if (/obrigatória ausente:\s*MERCADO_PAGO_ACCESS_TOKEN/i.test(message)) {
    return { status: 503, error: "Falta MERCADO_PAGO_ACCESS_TOKEN na Vercel (Production).", code: "missing_access_token" };
  }
  if (/obrigatória ausente:\s*MERCADO_PAGO_WEBHOOK_SECRET/i.test(message)) {
    return { status: 503, error: "Falta MERCADO_PAGO_WEBHOOK_SECRET na Vercel (Production).", code: "missing_webhook_secret" };
  }
  if (/obrigatória ausente:\s*MERCADO_PAGO_MODE|invalid_MERCADO_PAGO_MODE|deve ser exatamente/i.test(message)) {
    return { status: 503, error: "MERCADO_PAGO_MODE inválido. Use exatamente: production", code: "invalid_mode" };
  }
  if (/NEXT_PUBLIC_SITE_URL|SITE_URL|deve usar HTTPS/i.test(message)) {
    return {
      status: 503,
      error: "NEXT_PUBLIC_SITE_URL ausente ou sem HTTPS. Use https://www.brazilianremixservice.com.br",
      code: "invalid_site_url",
    };
  }
  if (/TEST-\.\.\.|teste \(TEST/i.test(message) || /Access Token de teste/i.test(message)) {
    return {
      status: 503,
      error: "Token de teste com MODE=production. Em Credenciais, copie o Access Token de Produção.",
      code: "test_token_production_mode",
    };
  }
  if (/Remova NEXT_PUBLIC_/i.test(message)) {
    return {
      status: 503,
      error: "Remova variáveis NEXT_PUBLIC_MERCADO_PAGO_* (secrets não podem ser públicas).",
      code: "public_secret_leak",
    };
  }
  if (/init_point|sandbox_init_point/i.test(message)) {
    return {
      status: 502,
      error:
        "Mercado Pago não retornou URL de checkout. Confira se o Access Token é de produção e MODE=production.",
      code: "missing_checkout_url",
    };
  }
  if (/Prisma|database|P1001|P1017|Can't reach/i.test(message)) {
    return {
      status: 502,
      error: "Falha ao gravar o pedido no banco. Verifique DATABASE_URL na Vercel.",
      code: "database_error",
    };
  }

  return {
    status: 502,
    error: "Não foi possível iniciar o pagamento. Tente novamente.",
    code: "preference_failed",
  };
}

export async function POST(request: Request) {
  let body: PreferenceBody;
  try {
    body = (await request.json()) as PreferenceBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido.", code: "invalid_json" }, { status: 400 });
  }

  const trusted = assertCheckoutPayloadTrusted(body);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error, code: "invalid_plan" }, { status: 400 });
  }

  const user = await getAuthenticatedPortalUser();
  const loginReturn =
    trusted.plan.serviceProduct === "deemix"
      ? `/deemix?checkout=${encodeURIComponent(trusted.plan.id)}`
      : trusted.plan.serviceProduct === "allavsoft"
        ? `/allavsoft?checkout=${encodeURIComponent(trusted.plan.id)}`
        : `/plans?checkout=${encodeURIComponent(trusted.plan.id)}`;
  if (!user) {
    const loginUrl = `/musicas/entrar?return=${encodeURIComponent(loginReturn.split("?")[0]!)}&checkout=${encodeURIComponent(trusted.plan.id)}`;
    return NextResponse.json(
      { error: "Faça login para continuar o checkout.", loginUrl, code: "unauthorized" },
      { status: 401 },
    );
  }

  if (
    trusted.plan.serviceProduct === "poolsVip" &&
    userHasActiveVipAccess({
      servicePoolsVip: user.services.poolsVip,
      nextDueAt: user.nextDueAt,
    })
  ) {
    const expiresLabel = formatDueDate(user.nextDueAt);
    return NextResponse.json(
      {
        error: `Você já tem VIP ativo até ${expiresLabel}. Aguarde o vencimento para assinar um novo plano.`,
        code: "vip_already_active",
        expiresAt: user.nextDueAt.toISOString(),
        expiresLabel,
      },
      { status: 409 },
    );
  }

  if (
    trusted.plan.serviceProduct === "deemix" &&
    user.services.deemix &&
    user.nextDueAt.getTime() > Date.now()
  ) {
    const expiresLabel = formatDueDate(user.nextDueAt);
    return NextResponse.json(
      {
        error: `Você já tem Deemix ativo até ${expiresLabel}. Aguarde o vencimento para assinar um novo plano.`,
        code: "deemix_already_active",
        expiresAt: user.nextDueAt.toISOString(),
        expiresLabel,
      },
      { status: 409 },
    );
  }

  if (trusted.plan.serviceProduct === "allavsoft" && user.services.allavsoft) {
    return NextResponse.json(
      {
        error: "Você já tem a licença vitalícia do Allavsoft nesta conta.",
        code: "allavsoft_already_active",
      },
      { status: 409 },
    );
  }

  const rate = checkRateLimit({
    key: `mp-preference:${user.id}`,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de checkout. Aguarde e tente novamente.", code: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  const diag = diagnoseMercadoPagoEnv();
  if (!diag.ok) {
    console.error("[mercadopago/preference] env diagnostic:", diag.issues.join(","));
    const classified = classifyPreferenceError(
      diag.issues[0] === "test_token_with_production_mode"
        ? "Access Token de teste"
        : diag.issues[0] === "missing_MERCADO_PAGO_ACCESS_TOKEN"
          ? "obrigatória ausente: MERCADO_PAGO_ACCESS_TOKEN"
          : diag.issues[0] === "missing_MERCADO_PAGO_WEBHOOK_SECRET"
            ? "obrigatória ausente: MERCADO_PAGO_WEBHOOK_SECRET"
            : diag.issues[0] === "missing_MERCADO_PAGO_MODE" || diag.issues[0] === "invalid_MERCADO_PAGO_MODE"
              ? "deve ser exatamente"
              : diag.issues[0] === "missing_NEXT_PUBLIC_SITE_URL" ||
                  diag.issues[0] === "site_url_must_be_https" ||
                  diag.issues[0] === "invalid_site_url"
                ? "NEXT_PUBLIC_SITE_URL"
                : diag.issues.join(","),
    );
    return NextResponse.json(
      {
        error: classified.error,
        code: classified.code,
        issues: diag.issues,
        present: diag.present,
      },
      { status: 503 },
    );
  }

  try {
    const result = await createMercadoPagoCheckoutPreference({
      plan: trusted.plan,
      payer: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      orderId: result.orderId,
    });
  } catch (err) {
    const message = sanitizeMercadoPagoErrorMessage(err);
    console.error("[mercadopago/preference] route error:", message);
    const classified = classifyPreferenceError(message);
    return NextResponse.json(
      { error: classified.error, code: classified.code },
      { status: classified.status },
    );
  }
}
