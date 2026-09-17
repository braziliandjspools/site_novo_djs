import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

/** Cota diária removida — VIP ativo = downloads ilimitados. Mantém a rota por compatibilidade. */
export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  const now = new Date();
  return withDownloaderCorsJson(request, {
    ok: true,
    quota: {
      tier: "UNLIMITED",
      tierLabel: "Ilimitado",
      trackLimit: null,
      tracksUsed: 0,
      tracksRemaining: null,
      packsUsed: 0,
      packLimit: null,
      exhausted: false,
      browserUnlimited: true,
      periodLabel: "ilimitado",
      windowStartedAt: now.toISOString(),
      windowEndsAt: null,
      resetsInSeconds: null,
    },
  });
}
