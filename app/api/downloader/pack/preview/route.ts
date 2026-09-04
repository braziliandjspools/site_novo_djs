import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";
import { parsePackDownloadInput, previewPackBySlug } from "../../../../lib/pack-download";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("slug") ?? searchParams.get("url") ?? "";
  const root = searchParams.get("root") === "colecoes" ? "colecoes" : "vip";
  const parsed = parsePackDownloadInput(raw) ?? (raw.trim() ? { slug: raw.trim() } : null);
  if (!parsed?.slug) {
    return withDownloaderCorsJson(
      request,
      { error: "Informe o link ou slug da pasta (ex.: julho-2024/semana-01/funk)." },
      { status: 400 },
    );
  }

  try {
    const result = await previewPackBySlug(parsed.slug, { root });
    if ("error" in result) {
      return withDownloaderCorsJson(request, { error: result.error }, { status: 404 });
    }
    return withDownloaderCorsJson(request, {
      ok: true,
      slug: result.folder.slug,
      folderId: result.folder.folderId,
      folderName: result.folder.displayName,
      relativePath: result.folder.relativePath,
      pathLabels: result.folder.pathLabels,
      trackCount: result.trackCount,
      sampleTitles: result.sampleTitles,
      root: result.folder.root,
      downloadUrl: `/musicas/dl/${result.folder.slug}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao validar a pasta.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
