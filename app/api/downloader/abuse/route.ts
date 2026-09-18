import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../lib/portal";
import { getDownloadAbuseStatus } from "../../../lib/download-abuse";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

/** Status de alerta/ban de download para o app desktop. */
export async function GET(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return withDownloaderCorsJson(request, { error: "Faça login." }, { status: 401 });
  }

  const abuse = await getDownloadAbuseStatus(user.id);
  return withDownloaderCorsJson(request, { ok: true, abuse });
}
