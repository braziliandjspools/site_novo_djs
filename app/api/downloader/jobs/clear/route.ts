import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { clearDownloadQueue } from "../../../../lib/downloader";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

/** Zera a fila ativa do usuário (cancela jobs pendentes/em andamento/falhos). */
export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  try {
    const cleared = await clearDownloadQueue(access.user.id);
    return withDownloaderCorsJson(request, { ok: true, cleared });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível zerar a fila.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
