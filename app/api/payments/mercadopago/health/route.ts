import { NextResponse } from "next/server";
import { diagnoseMercadoPagoEnv } from "../../../../lib/mercadopago/env";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnóstico seguro das envs Mercado Pago (sem valores/secrets).
 * Requer login. Use para conferir Production na Vercel.
 */
export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login." }, { status: 401 });
  }

  const diag = diagnoseMercadoPagoEnv();
  return NextResponse.json({
    ok: diag.ok,
    mode: diag.mode,
    siteUrlHost: diag.siteUrlHost,
    present: diag.present,
    issues: diag.issues,
  });
}
