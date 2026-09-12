import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { listPortalPaymentsForUser } from "../../../../lib/portal-payments";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const payload = await listPortalPaymentsForUser(user.id);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[portal/payments]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao carregar financeiro.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
