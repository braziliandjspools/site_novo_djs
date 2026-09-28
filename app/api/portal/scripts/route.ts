import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../lib/portal";
import { userHasSubscriptionPlan } from "../../../lib/portal-users";
import { PORTAL_ADMIN_SCRIPTS } from "../../../lib/portal-scripts";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login no portal." }, { status: 401, headers: privateHeaders });
  }
  if (!userHasSubscriptionPlan(user)) {
    return NextResponse.json({ error: "Os scripts estão disponíveis para clientes com plano ativo." }, {
      status: 403,
      headers: privateHeaders,
    });
  }

  return NextResponse.json({ scripts: PORTAL_ADMIN_SCRIPTS }, { headers: privateHeaders });
}
