import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import { getAdminStats } from "../../../lib/admin-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Varredura do Drive pode demorar em acervos grandes. */
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const url = new URL(request.url);
  const forceCatalogRefresh =
    url.searchParams.get("refresh") === "1" || url.searchParams.get("refresh") === "true";

  try {
    const stats = await getAdminStats({ forceCatalogRefresh });
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats failed:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao carregar relatórios do admin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
