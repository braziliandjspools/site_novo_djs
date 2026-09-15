import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";
import {
  importArtistJobsBySlug,
  importPackJobsBySlug,
  parsePackDownloadInput,
} from "../../../../lib/pack-download";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withDownloaderCorsJson(request, { error: "Requisição inválida." }, { status: 400 });
  }

  const data = body as {
    slug?: unknown;
    url?: unknown;
    targetDeviceId?: unknown;
    root?: unknown;
    kind?: unknown;
  };
  const raw =
    (typeof data.url === "string" && data.url.trim()) ||
    (typeof data.slug === "string" && data.slug.trim()) ||
    "";
  const kindHint = typeof data.kind === "string" ? data.kind.trim().toLowerCase() : "";
  const parsed =
    parsePackDownloadInput(raw) ??
    (raw
      ? kindHint === "artist"
        ? ({ kind: "artist" as const, slug: raw })
        : ({ kind: "pack" as const, slug: raw, root: "vip" as const })
      : null);
  if (!parsed?.slug) {
    return withDownloaderCorsJson(
      request,
      { error: "Informe o link da pasta ou do artista." },
      { status: 400 },
    );
  }

  const targetDeviceId =
    typeof data.targetDeviceId === "string" && data.targetDeviceId.trim()
      ? data.targetDeviceId.trim()
      : null;
  const isArtist = parsed.kind === "artist" || kindHint === "artist";

  try {
    if (isArtist) {
      const result = await importArtistJobsBySlug(access.user.id, parsed.slug, { targetDeviceId });
      if ("error" in result) {
        return withDownloaderCorsJson(request, { error: result.error }, { status: 404 });
      }
      return withDownloaderCorsJson(
        request,
        {
          ok: true,
          kind: "artist",
          count: result.count,
          trackCount: result.trackCount,
          folderName: result.folder.displayName,
          relativePath: result.folder.relativePath,
          slug: result.folder.slug,
          root: "vip",
        },
        { status: 201 },
      );
    }

    const root =
      data.root === "colecoes" || (parsed.kind === "pack" && parsed.root === "colecoes")
        ? "colecoes"
        : "vip";
    const result = await importPackJobsBySlug(access.user.id, parsed.slug, {
      targetDeviceId,
      root,
    });
    if ("error" in result) {
      return withDownloaderCorsJson(request, { error: result.error }, { status: 404 });
    }
    return withDownloaderCorsJson(
      request,
      {
        ok: true,
        kind: "pack",
        count: result.count,
        trackCount: result.trackCount,
        folderName: result.folder.displayName,
        relativePath: result.folder.relativePath,
        slug: result.folder.slug,
        root: result.folder.root,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enfileirar faixas.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
