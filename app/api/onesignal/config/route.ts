import { NextResponse } from "next/server";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

/** App ID do OneSignal é público (já vai no JS do site). Expõe para o Downloader init em runtime. */
export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() ?? "";
  if (!appId) {
    return withDownloaderCorsJson(
      request,
      { ok: false, configured: false, appId: null, error: "OneSignal não configurado no servidor." },
      { status: 503 },
    );
  }
  return withDownloaderCorsJson(request, { ok: true, configured: true, appId });
}
