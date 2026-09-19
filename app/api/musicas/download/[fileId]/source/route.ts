import { NextResponse } from "next/server";
import { getAudioSourceUrl } from "../../../../../lib/google-drive";
import { getDriveUserContentDownloadUrl } from "../../../../../lib/drive-audio-stream";
import { requireVipMusicAccess } from "../../../../../lib/vip-music-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

/**
 * Devolve a URL de origem do arquivo para baixar direto do Drive
 * (Downloader e web VIP), evitando proxy de bytes na VPS.
 * Resposta web nunca inclui API key.
 */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const client = request.headers.get("X-BP-Client");
  const isDownloader = client === "downloader";

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const url = isDownloader
    ? getAudioSourceUrl(fileId)
    : getDriveUserContentDownloadUrl(fileId);

  return NextResponse.json({
    ok: true,
    url,
  });
}
