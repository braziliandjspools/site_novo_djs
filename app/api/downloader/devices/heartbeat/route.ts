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

  const result = await heartbeatDownloadDevice(access.user.id, parsed.value!.deviceId);
  if (!result.ok) {
    if (result.code === "device_not_found") {
      return withDownloaderCorsJson(
        request,
        { error: "Dispositivo não encontrado. Registre-o primeiro.", code: result.code },
        { status: 404 },
      );
    }

    const activeName = result.activeDeviceName?.trim();
    const error = activeName
      ? `Outro PC já está conectado com esta conta (${activeName}). Feche o Downloader nele ou use só este computador.`
      : "Outro PC já está conectado com esta conta. Só é permitida uma conexão por usuário.";

    return withDownloaderCorsJson(
      request,
      {
        error,
        code: result.code,
        activeDeviceName: result.activeDeviceName ?? null,
      },
      { status: 409 },
    );
  }

  return withDownloaderCorsJson(request, { ok: true, device: result.device });
}
