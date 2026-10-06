import { NextResponse } from "next/server";
import { getAudioSourceUrl } from "../../../../../lib/google-drive";
import { getDriveUserContentDownloadUrl } from "../../../../../lib/drive-audio-stream";
import { requireVipMusicAccess } from "../../../../../lib/vip-music-access";
import { getSendNowDirectUrl, isSendNowFileId, sendNowFileCode } from "../../../../../lib/send-now";
import { GOOGLE_DRIVE_PRIVATE_ACCESS } from "../../../../../lib/site";
import { isVipDriveTrackFile } from "../../../../../lib/vip-drive-view";

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

  if (isSendNowFileId(fileId)) {
    try {
      const url = await getSendNowDirectUrl(sendNowFileCode(fileId));
      return NextResponse.json({ ok: true, url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no send.now.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (GOOGLE_DRIVE_PRIVATE_ACCESS && !(await isVipDriveTrackFile(fileId))) {
    return NextResponse.json({ error: "Faixa não encontrada no acervo VIP." }, { status: 404 });
  }

  let url: string;
  if (!GOOGLE_DRIVE_PRIVATE_ACCESS) {
    url = isDownloader ? getAudioSourceUrl(fileId) : getDriveUserContentDownloadUrl(fileId);
  } else if (isDownloader) {
    const requestUrl = new URL(request.url);
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const accessToken = requestUrl.searchParams.get("access_token")?.trim() || bearer;
    const streamUrl = new URL(`/api/downloader/stream/${encodeURIComponent(fileId)}`, request.url);
    if (accessToken) streamUrl.searchParams.set("access_token", accessToken);
    url = streamUrl.toString();
  } else {
    url = new URL(`/api/musicas/drive/${encodeURIComponent(fileId)}`, request.url).toString();
  }

  return NextResponse.json({
    ok: true,
    url,
  });
}
