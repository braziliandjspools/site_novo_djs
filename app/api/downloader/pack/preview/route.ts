import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";
import {
  parsePackDownloadInput,
  previewArtistBySlug,
  previewPackBySlug,
} from "../../../../lib/pack-download";

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
  const raw =
    searchParams.get("url")?.trim() ||
    searchParams.get("slug")?.trim() ||
    "";
  const kindParam = searchParams.get("kind")?.trim().toLowerCase();
  const rootParam = searchParams.get("root") === "colecoes" ? "colecoes" : null;
  const parsed =
    parsePackDownloadInput(raw) ??
    (raw.trim()
      ? kindParam === "artist"
        ? ({ kind: "artist" as const, slug: raw.trim() })
        : ({ kind: "pack" as const, slug: raw.trim(), root: "vip" as const })
      : null);
  if (!parsed?.slug) {
    return withDownloaderCorsJson(
      request,
      {
        error:
          "Informe o link da pasta (ex.: 04-abril-2024/funk) ou do artista (ex.: /musicas/artistas/alok).",
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.kind === "artist" || kindParam === "artist") {
      const result = await previewArtistBySlug(parsed.slug);
      if ("error" in result) {
        return withDownloaderCorsJson(request, { error: result.error }, { status: 404 });
      }
      return withDownloaderCorsJson(request, {
        ok: true,
        kind: "artist",
        slug: result.folder.slug,
        folderId: result.folder.folderId,
        folderName: result.folder.displayName,
        relativePath: result.folder.relativePath,
        pathLabels: result.folder.pathLabels,
        trackCount: result.trackCount,
        sampleTitles: result.sampleTitles,
        hasSubfolders: result.hasSubfolders,
        trackCountIsEstimate: result.trackCountIsEstimate,
        subfolderCount: 0,
        root: "vip",
        downloadUrl: `/musicas/artistas/${encodeURIComponent(result.folder.slug)}`,
      });
    }

    const root = rootParam ?? (parsed.kind === "pack" ? parsed.root : "vip");
    const result = await previewPackBySlug(parsed.slug, { root });
    if ("error" in result) {
      return withDownloaderCorsJson(request, { error: result.error }, { status: 404 });
    }
    const downloadUrl =
      result.folder.root === "colecoes"
        ? `/musicas/colecoes/${result.folder.slug}`
        : `/musicas/atualizacoes/${result.folder.slug}`;
    return withDownloaderCorsJson(request, {
      ok: true,
      kind: "pack",
      slug: result.folder.slug,
      folderId: result.folder.folderId,
      folderName: result.folder.displayName,
      relativePath: result.folder.relativePath,
      pathLabels: result.folder.pathLabels,
      trackCount: result.trackCount,
      sampleTitles: result.sampleTitles,
      hasSubfolders: result.hasSubfolders,
      trackCountIsEstimate: result.trackCountIsEstimate,
      subfolderCount: result.subfolderCount ?? 0,
      root: result.folder.root,
      downloadUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao validar a pasta.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
