import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../lib/downloader-access";
import { getDownloaderQuotaSnapshot } from "../../../lib/downloader-quota";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  try {
    const quota = await getDownloaderQuotaSnapshot(access.user.id);
    return withDownloaderCorsJson(request, { ok: true, quota });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar cota.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
