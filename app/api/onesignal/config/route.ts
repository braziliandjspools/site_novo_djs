import { NextResponse } from "next/server";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

/**
 * App ID do OneSignal é público (já vai no JS do site).
 * Expõe para o Downloader init em runtime.
 *
 * CORS aberto: o app desktop usa fetch() do WebView (não o bridge Rust),
 * então Origin varia (tauri.localhost, null, etc.) e sem * o init falha
 * com "servidor sem App ID" mesmo com a env correta.
 */
function withPublicCors(request: Request, body: unknown, init?: ResponseInit) {
  const response = withDownloaderCorsJson(request, body, init);
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-BP-Client");
  return response;
}

export async function OPTIONS(request: Request) {
  const preflight = handleDownloaderCorsPreflight(request);
  if (preflight) {
    preflight.headers.set("Access-Control-Allow-Origin", "*");
    preflight.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    preflight.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-BP-Client");
    return preflight;
  }
  return withPublicCors(request, null, { status: 204 });
}

function readOneSignalAppId() {
  // Runtime (Dokploy) + build-time (NEXT_PUBLIC_ inlined)
  return (
    process.env.ONESIGNAL_APP_ID?.trim() ||
    process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() ||
    ""
  );
}

export async function GET(request: Request) {
  const appId = readOneSignalAppId();
  if (!appId) {
    return withPublicCors(
      request,
      { ok: false, configured: false, appId: null, error: "OneSignal não configurado no servidor." },
      { status: 503 },
    );
  }
  return withPublicCors(request, { ok: true, configured: true, appId });
}
