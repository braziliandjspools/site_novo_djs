import { NextResponse } from "next/server";
import { contentDispositionAttachment, contentTypeForFilename } from "../../../../../lib/google-drive";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../../lib/drive-audio-stream";
import { externalLinkSecret, verifyExternalMusicToken } from "../../../../../lib/external-music-link";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Context = { params: Promise<{ token: string; filename: string }> };
const MAX_EXTERNAL_STREAMS = 4;
let activeExternalStreams = 0;

function authorizedFile(token: string, filename: string) {
  const secret = externalLinkSecret();
  const file = secret ? verifyExternalMusicToken(token, secret) : null;
  return file?.name === filename ? file : null;
}

function downloadHeaders(file: { name: string }, upstream: Parameters<typeof driveAudioResponseHeaders>[0]) {
  const headers = driveAudioResponseHeaders(upstream);
  headers.set("Content-Type", contentTypeForFilename(file.name));
  headers.set("Content-Disposition", contentDispositionAttachment(file.name));
  headers.set("Cache-Control", "private, no-store");
  return headers;
}

export async function HEAD(request: Request, context: Context) {
  const { token, filename } = await context.params;
  const file = authorizedFile(token, filename);
  if (!file) return new Response(null, { status: 403, headers: { "Cache-Control": "no-store" } });

  const probe = new Request(request.url, { headers: { Range: "bytes=0-0" } });
  const upstream = await fetchDriveAudioUpstream(file.fileId, probe);
  if ("error" in upstream) return new Response(null, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
  await upstream.body.cancel();
  const headers = downloadHeaders(file, upstream);
  const total = upstream.contentRange?.match(/\/(\d+)$/)?.[1];
  if (total) headers.set("Content-Length", total);
  else if (upstream.status === 206) headers.delete("Content-Length");
  headers.delete("Content-Range");
  return new Response(null, { status: 200, headers });
}

export async function GET(request: Request, context: Context) {
  const { token, filename } = await context.params;
  const file = authorizedFile(token, filename);
  if (!file) return NextResponse.json({ error: "Link inválido ou expirado. Copie um novo link na BRS." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (activeExternalStreams >= MAX_EXTERNAL_STREAMS) {
    return NextResponse.json({ error: "Muitos downloads simultâneos. Aguarde alguns segundos." }, { status: 503, headers: { "Retry-After": "10", "Cache-Control": "no-store" } });
  }

  const upstream = await fetchDriveAudioUpstream(file.fileId, request);
  if ("error" in upstream) return NextResponse.json({ error: upstream.error }, { status: upstream.status, headers: { "Cache-Control": "no-store" } });

  activeExternalStreams += 1;
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  upstream.body.pipeTo(writable).catch(() => {
    /* Cliente cancelou ou Google Drive interrompeu o envio. */
  }).finally(() => {
    activeExternalStreams = Math.max(0, activeExternalStreams - 1);
  });
  return new NextResponse(readable, { status: upstream.status, headers: downloadHeaders(file, upstream) });
}
