import { NextResponse } from "next/server";
import { getCanonicalPlanById } from "../../../../lib/billing/plan-catalog";
import { diagnoseMercadoPagoEnv } from "../../../../lib/mercadopago/env";
import {
  createMercadoPagoCheckoutPreference,
  sanitizeMercadoPagoErrorMessage,
} from "../../../../lib/mercadopago/preference";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { PORTAL_WALLET_TOPUP_PLAN_ID, walletDecimal } from "../../../../lib/portal-wallet";
import { checkRateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) return NextResponse.json({ error: "Entre no Portal para adicionar saldo." }, { status: 401 });
  const rate = checkRateLimit({ key: `portal-wallet-topup:${user.id}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  let amount: ReturnType<typeof walletDecimal>;
  try {
    const body = (await request.json()) as { amount?: unknown };
    if (typeof body.amount !== "string" && typeof body.amount !== "number") throw new Error();
    amount = walletDecimal(body.amount);
    if (amount.lte(0)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Informe um valor positivo com até duas casas decimais." }, { status: 400 });
  }

  const diag = diagnoseMercadoPagoEnv();
  if (!diag.ok) {
    return NextResponse.json({ error: "O pagamento está temporariamente indisponível. Tente novamente mais tarde." }, { status: 503 });
  }
  const catalogPlan = getCanonicalPlanById("brs-allavsoft-lifetime");
  if (!catalogPlan) return NextResponse.json({ error: "Não foi possível iniciar a recarga." }, { status: 503 });

  try {
    const topupPlan = {
      ...catalogPlan,
      id: PORTAL_WALLET_TOPUP_PLAN_ID as typeof catalogPlan.id,
      title: "Recarga de saldo BRS",
      description: "Adicionar saldo à carteira do Portal Brazilian Remix Service.",
      amountBrl: amount.toFixed(2),
      serviceProduct: "poolsVip" as const,
    };
    const result = await createMercadoPagoCheckoutPreference({
      plan: topupPlan,
      payer: { id: user.id, email: user.email, name: user.name },
    });
    return NextResponse.json({ checkoutUrl: result.checkoutUrl, orderId: result.orderId });
  } catch (error) {
    console.error("[portal/wallet/topup]", sanitizeMercadoPagoErrorMessage(error));
    return NextResponse.json({ error: "Não foi possível iniciar a recarga. Tente novamente." }, { status: 502 });
  }
}
