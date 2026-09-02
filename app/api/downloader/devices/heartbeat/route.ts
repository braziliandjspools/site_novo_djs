import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { heartbeatDownloadDevice, parseHeartbeatBody } from "../../../../lib/downloader";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = parseHeartbeatBody(body);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const device = await heartbeatDownloadDevice(access.user.id, parsed.value!.deviceId);
  if (!device) {
    return NextResponse.json({ error: "Dispositivo não encontrado. Registre-o primeiro." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, device });
}
