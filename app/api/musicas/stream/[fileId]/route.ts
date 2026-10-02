import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../lib/drive-audio-stream";
import { resolveVipMusicStreamAccess } from "../../../../lib/vip-music-access";
import { fetchSendNowAudio, isSendNowFileId, sendNowFileCode } from "../../../../lib/send-now";
import { decodeR2AudioFileId, isR2AudioFileId, readR2Audio } from "../../../../lib/music-studio/storage";

export const dynamic = "force-dynamic";
/** Streams longos no Dokploy/Node (faixas VIP). */
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await resolveVipMusicStreamAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error ?? "Stream indisponível" }, { status: 403 });
  }

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (isR2AudioFileId(fileId)) {
    const key = decodeR2AudioFileId(fileId);
    if (!key) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    try {
      const upstream = await readR2Audio(key, request);
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "private, max-age=60");
      const length = upstream.headers.get("content-length");
      const range = upstream.headers.get("content-range");
      if (length) headers.set("Content-Length", length);
      if (range) headers.set("Content-Range", range);
      return new NextResponse(upstream.body, { status: range ? 206 : 200, headers });
    } catch {
      return NextResponse.json({ error: "Áudio não encontrado." }, { status: 404 });
    }
  }

  if (isSendNowFileId(fileId)) {
    try {
      const upstream = await fetchSendNowAudio(sendNowFileCode(fileId), request);
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
      headers.set("Accept-Ranges", "bytes");
      headers.set("Cache-Control", "private, no-store, max-age=0");
      headers.set("X-Accel-Buffering", "no");
      const length = upstream.headers.get("content-length");
      const range = upstream.headers.get("content-range");
      if (length) headers.set("Content-Length", length);
      if (range) headers.set("Content-Range", range);
      return new NextResponse(upstream.body, { status: upstream.status, headers });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no send.now.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
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
  } catch (error) {
    console.error("[musicas/stream]", fileId, error);
    return NextResponse.json({ error: "Falha no stream" }, { status: 502 });
  }
}
