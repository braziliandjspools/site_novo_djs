import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../lib/drive-audio-stream";
import { getAuthorizedVipDriveTrack } from "../../../../lib/vip-drive-view";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const access = await getAuthorizedVipDriveTrack(fileId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const upstream = await fetchDriveAudioUpstream(fileId, request);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    }
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: driveAudioResponseHeaders(upstream, { inline: true }),
    });
  } catch (error) {
    console.error("[musicas/drive] stream failed", error);
    return NextResponse.json({ error: "Falha ao carregar a faixa." }, { status: 502 });
  }
}
