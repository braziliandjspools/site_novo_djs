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
  publicDriveDownloadNeedsOwnerProxy,
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
 * - Sem cota: 302 para o Drive (a VPS só autentica).
 * - Cota pública: proxy OAuth do dono, o mesmo caminho de ?proxy=1.
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
  const quotaBlocked = forceProxy ? false : await publicDriveDownloadNeedsOwnerProxy(fileId);

  if (!forceProxy && !quotaBlocked) {
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
  // Prioriza o nome original do arquivo no Google Drive; o nome vindo da UI\n  // serve apenas de fallback quando a API de metadados estiver indisponível.\n  const driveName = await getDriveFileName(fileId).catch(() => null);
  const filename = ensureAudioExtension(driveName ?? requestedName ?? "faixa.mp3");

  try {
    const upstream = await fetchDriveAudioUpstream(fileId, request);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    activeProxyDownloads += 1;
    const headers = driveAudioResponseHeaders(upstream);
    headers.set("Content-Type", contentTypeForFilename(filename));
    headers.set("Content-Disposition", contentDispositionAttachment(filename));
    // O navegador deve baixar o áudio, nunca reproduzi-lo como página inline.

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
