import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { heartbeatDownloadDevice, parseHeartbeatBody } from "../../../../lib/downloader";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withDownloaderCorsJson(request, { error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = parseHeartbeatBody(body);
  if ("error" in parsed && parsed.error) {
    return withDownloaderCorsJson(request, { error: parsed.error }, { status: 400 });
  }

  const device = await heartbeatDownloadDevice(access.user.id, parsed.value!.deviceId);
  if (!device) {
    return withDownloaderCorsJson(
      request,
      { error: "Dispositivo não encontrado. Registre-o primeiro." },
      { status: 404 },
    );
  }

  return withDownloaderCorsJson(request, { ok: true, device });
}
