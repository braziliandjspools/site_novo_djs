import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../lib/drive-audio-stream";
import { resolveVipMusicStreamAccess } from "../../lib/vip-music-access";
import { GOOGLE_DRIVE_PRIVATE_ACCESS } from "../../lib/site";
import { isVipDriveTrackFile } from "../../lib/vip-drive-view";

export async function POST(request: Request) {
  const access = await resolveVipMusicStreamAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let id: string | undefined;

  try {
    const body = (await request.json()) as { id?: string };
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (GOOGLE_DRIVE_PRIVATE_ACCESS && !(await isVipDriveTrackFile(id))) {
    return NextResponse.json({ error: "Faixa não encontrada no acervo VIP." }, { status: 404 });
  }

  try {
    const upstream = await fetchDriveAudioUpstream(id, request);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    const headers = driveAudioResponseHeaders(upstream, { inline: true });
    headers.set("Content-Type", "application/octet-stream");

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch {
    return NextResponse.json({ error: "Falha no stream" }, { status: 502 });
  }
}
