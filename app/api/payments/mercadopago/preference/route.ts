import { NextResponse } from "next/server";
import { assertCheckoutPayloadTrusted } from "../../../../lib/billing/plan-catalog";
import {
  createMercadoPagoCheckoutPreference,
  sanitizeMercadoPagoErrorMessage,
} from "../../../../lib/mercadopago/preference";
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

export async function POST(request: Request) {
  let body: PreferenceBody;
  try {
    body = (await request.json()) as PreferenceBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const trusted = assertCheckoutPayloadTrusted(body);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 400 });
  }

  const user = await getAuthenticatedPortalUser();
  if (!user) {
    const loginUrl = `/musicas/entrar?return=${encodeURIComponent("/plans")}&checkout=${encodeURIComponent(trusted.plan.id)}`;
    return NextResponse.json(
      { error: "Faça login para continuar o checkout.", loginUrl },
      { status: 401 },
    );
  }

  const rate = checkRateLimit({
    key: `mp-preference:${user.id}`,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas de checkout. Aguarde e tente novamente." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
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

    // Resposta mínima — sem Access Token nem payload integral do Mercado Pago.
    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      orderId: result.orderId,
    });
  } catch (err) {
    const message = sanitizeMercadoPagoErrorMessage(err);
    const isConfig =
      message.includes("Variável de ambiente") ||
      message.includes("NEXT_PUBLIC_SITE_URL") ||
      message.includes("MERCADO_PAGO");

    return NextResponse.json(
      {
        error: isConfig
          ? "Checkout Mercado Pago ainda não configurado."
          : "Não foi possível iniciar o pagamento. Tente novamente.",
      },
      { status: isConfig ? 503 : 502 },
    );
  }
}
