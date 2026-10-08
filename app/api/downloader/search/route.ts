import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";
import { BRS_MUSIC_SEARCH_ENABLED } from "../../../lib/feature-flags";
import { searchDownloaderTracks } from "../../../lib/downloader-music-search";
import { warmVipMusicSearchIndex } from "../../../lib/vip-music-search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  if (!BRS_MUSIC_SEARCH_ENABLED) {
    return withDownloaderCorsJson(
      request,
      { error: "Buscador de músicas desativado neste ambiente." },
      { status: 404 },
    );
  }

  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limit = Math.min(40, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "24", 10) || 24));

  if (query.trim().length < 2) {
    void warmVipMusicSearchIndex({ recentMonths: 2, recentDays: 10 }).catch(() => undefined);
    return withDownloaderCorsJson(request, { results: [], total: 0, query: query });
  }

  try {
    const { results, total } = await searchDownloaderTracks(query, limit);
    return withDownloaderCorsJson(request, {
      results,
      total,
      query,
      limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na pesquisa.";
    console.error("[downloader/search]", message);
    return withDownloaderCorsJson(request, { error: message, results: [], total: 0 }, { status: 500 });
  }
}
