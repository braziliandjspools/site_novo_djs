import { NextResponse } from "next/server";
import {
  contentDispositionAttachment,
  contentTypeForFilename,
  ensureAudioExtension,
  getDriveFileName,
} from "../../../../lib/google-drive";
import {
  driveAudioResponseHeaders,
  fetchDriveAudioUpstream,
  getDriveUserContentDownloadUrl,
} from "../../../../lib/drive-audio-stream";
import { requireVipMusicAccess } from "../../../../lib/vip-music-access";

export const dynamic = "force-dynamic";
/** Streams longos no Dokploy/Node — só no modo ?proxy=1. */
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

/** Downloads proxy simultâneos por instância — evita saturar CPU/RAM da VPS. */
const MAX_PROXY_DOWNLOADS = 4;
let activeProxyDownloads = 0;

function releaseProxySlot() {
  activeProxyDownloads = Math.max(0, activeProxyDownloads - 1);
}

/**
 * Download de faixa (VIP):
 * - Padrão: 302 para o Drive (VPS só autentica — não passa o áudio pelo Node).
 * - ?proxy=1: proxy OAuth/API (fallback se o link público falhar por cota).
 */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const forceProxy = searchParams.get("proxy") === "1";

  if (!forceProxy) {
    return NextResponse.redirect(getDriveUserContentDownloadUrl(fileId), 302);
  }

  if (activeProxyDownloads >= MAX_PROXY_DOWNLOADS) {
    return NextResponse.json(
      {
        error:
          "Muitos downloads ao mesmo tempo neste servidor. Aguarde alguns segundos ou use o BRS Downloader.",
      },
      { status: 503, headers: { "Retry-After": "8" } },
    );
  }

  const requestedName = searchParams.get("name");
  const driveName = requestedName ? null : await getDriveFileName(fileId);
  const filename = ensureAudioExtension(requestedName ?? driveName ?? "faixa.mp3");

  try {
    const upstream = await fetchDriveAudioUpstream(fileId, request);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    activeProxyDownloads += 1;
    const headers = driveAudioResponseHeaders(upstream, { inline: true });
    headers.set("Content-Type", contentTypeForFilename(filename));
    headers.set("Content-Disposition", contentDispositionAttachment(filename));

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    upstream.body
      .pipeTo(writable)
      .catch(() => {
        /* cliente cancelou / upstream caiu */
      })
      .finally(() => {
        releaseProxySlot();
      });

    return new NextResponse(readable, { status: upstream.status, headers });
  } catch (error) {
    console.error("[musicas/download]", fileId, error);
    return NextResponse.json({ error: "Falha ao baixar." }, { status: 502 });
  }
}
