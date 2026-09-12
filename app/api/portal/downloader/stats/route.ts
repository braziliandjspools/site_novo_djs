import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { getPortalDownloaderStats } from "../../../../lib/portal-downloader-stats";
import { userHasPools } from "../../../../lib/portal-users";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!userHasPools(user)) {
    return NextResponse.json(
      { error: "Seu plano não inclui Pools VIP / Downloader." },
      { status: 403 },
    );
  }

  try {
    const stats = await getPortalDownloaderStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[portal/downloader/stats]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao carregar estatísticas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
