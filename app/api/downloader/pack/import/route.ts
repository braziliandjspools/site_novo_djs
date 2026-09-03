import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";
import { importPackJobsBySlug, parsePackDownloadInput } from "../../../../lib/pack-download";

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

  const data = body as { slug?: unknown; url?: unknown; targetDeviceId?: unknown };
  const raw =
    (typeof data.slug === "string" && data.slug) ||
    (typeof data.url === "string" && data.url) ||
    "";
  const parsed = parsePackDownloadInput(raw) ?? (raw.trim() ? { slug: raw.trim() } : null);
  if (!parsed?.slug) {
    return withDownloaderCorsJson(request, { error: "Informe o link ou slug da pasta." }, { status: 400 });
  }

  const targetDeviceId =
    typeof data.targetDeviceId === "string" && data.targetDeviceId.trim()
      ? data.targetDeviceId.trim()
      : null;

  try {
    const result = await importPackJobsBySlug(access.user.id, parsed.slug, { targetDeviceId });
    if ("error" in result) {
      return withDownloaderCorsJson(request, { error: result.error }, { status: 404 });
    }
    return withDownloaderCorsJson(
      request,
      {
        ok: true,
        count: result.count,
        trackCount: result.trackCount,
        folderName: result.folder.displayName,
        relativePath: result.folder.relativePath,
        slug: result.folder.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enfileirar faixas.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
