import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../lib/portal";
import { getPortalWalletBalance } from "../../../lib/portal-wallet";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const balance = await getPortalWalletBalance(user.id);
  return NextResponse.json({ balance }, { headers: { "Cache-Control": "no-store" } });
}
