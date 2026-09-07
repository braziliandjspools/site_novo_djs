import { NextResponse } from "next/server";
import { buildHotmartCheckoutUrl } from "../../../../lib/hotmart/checkout";
import { getPublicHotmartCheckoutUrl } from "../../../../lib/hotmart/config";
import { HOTMART_DRIVE_MONTHLY_PLAN } from "../../../../lib/hotmart/plans";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ planId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { planId } = await context.params;
  const allowed = planId === HOTMART_DRIVE_MONTHLY_PLAN.id;
  if (!allowed) {
    return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  }

  const checkoutConfigured = getPublicHotmartCheckoutUrl(planId);
  if (!checkoutConfigured) {
    return NextResponse.json(
      { error: "Checkout Hotmart não configurado." },
      { status: 503 },
    );
  }

  const user = await getAuthenticatedPortalUser();
  const wantsJson = new URL(request.url).searchParams.get("format") === "json";

  if (!user) {
    const loginUrl = `/musicas/entrar?return=${encodeURIComponent("/plans")}&checkout=${encodeURIComponent(planId)}`;
    if (wantsJson) {
      return NextResponse.json({ ok: false, loginUrl }, { status: 401 });
    }
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  const checkoutUrl = buildHotmartCheckoutUrl(planId, {
    id: user.id,
    email: user.email,
    name: user.name,
  });

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Checkout Hotmart não configurado." },
      { status: 503 },
    );
  }

  if (wantsJson) {
    return NextResponse.json({ ok: true, checkoutUrl });
  }

  return NextResponse.redirect(checkoutUrl);
}
