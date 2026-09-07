import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../lib/drive-audio-stream";
import { resolveVipMusicStreamAccess } from "../../../lib/vip-music-access";

export async function POST(request: Request) {
  const access = await resolveVipMusicStreamAccess();
  if (!access.ok) {
    return NextResponse.json({ error: "Stream indisponível" }, { status: 403 });
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

  try {
    const upstream = await fetchDriveAudioUpstream(
      id,
      undefined,
      access.mode === "preview" ? { previewMaxBytes: access.maxBytes } : undefined,
    );
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: driveAudioResponseHeaders(upstream, {
        inline: true,
        previewSeconds: access.mode === "preview" ? access.previewSeconds : null,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Falha no stream" }, { status: 502 });
  }
}
