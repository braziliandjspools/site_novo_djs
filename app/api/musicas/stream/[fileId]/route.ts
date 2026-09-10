import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../lib/drive-audio-stream";
import { resolveVipMusicStreamAccess } from "../../../../lib/vip-music-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await resolveVipMusicStreamAccess();
  if (!access.ok) {
    return NextResponse.json({ error: "Stream indisponível" }, { status: 403 });
  }

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const upstream = await fetchDriveAudioUpstream(fileId, request);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: driveAudioResponseHeaders(upstream, { inline: true }),
    });
  } catch {
    return NextResponse.json({ error: "Falha no stream" }, { status: 502 });
  }
}
