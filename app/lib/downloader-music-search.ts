import "server-only";
import { prisma } from "./prisma";
import { catalogMediaUrl } from "./catalog-media";
import { searchVipMusic } from "./vip-music-search";

export type DownloaderSearchTrack = {
  trackId: string;
  /** ID usado no stream/preview (pode diferir do arquivo de download). */
  previewTrackId: string;
  fileName: string;
  title: string;
  artist: string;
  version: string | null;
  genre: string | null;
  bpm: number | null;
  duration: number | null;
  year: number | null;
  coverUrl: string | null;
  relativePath: string;
  provider: "google_drive";
  source: "vip" | "brs_production";
  previewAvailable: boolean;
  downloadAvailable: boolean;
};

const DEFAULT_LIMIT = 24;

function durationToSeconds(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const parts = value.trim().split(":").map((part) => Number(part));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return null;
}

/**
 * Pesquisa faixas no catálogo VIP (/musicas/atualizacoes) e nas produções BRS.
 * O app nunca fala com o Drive — só a API do site.
 */
export async function searchDownloaderTracks(
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<{ results: DownloaderSearchTrack[]; total: number }> {
  const q = query.trim();
  if (q.length < 2) return { results: [], total: 0 };

  const max = Math.min(Math.max(limit, 1), 40);
  const results: DownloaderSearchTrack[] = [];
  const seen = new Set<string>();

  // VIP + produções em paralelo; prioriza Atualizações na montagem do resultado.
  const [vip, productions] = await Promise.all([
    searchVipUpdateTracks(q, max),
    searchBrsProductions(q, max),
  ]);

  for (const item of vip) {
    if (seen.has(item.trackId)) continue;
    seen.add(item.trackId);
    results.push(item);
    if (results.length >= max) break;
  }

  if (results.length < max) {
    for (const item of productions) {
      if (seen.has(item.trackId)) continue;
      seen.add(item.trackId);
      results.push(item);
      if (results.length >= max) break;
    }
  }

  return { results, total: results.length };
}

async function searchVipUpdateTracks(q: string, limit: number): Promise<DownloaderSearchTrack[]> {
  if (limit <= 0) return [];
  try {
    const tracks = await searchVipMusic(q, limit, {
      tracksOnly: true,
      recentMonths: 2,
      recentDays: 14,
    });

    return tracks.slice(0, limit).map((hit) => {
      const title = hit.title?.trim() || hit.label.split(" — ")[0]?.trim() || hit.label;
      const artist =
        hit.artist?.trim() ||
        (hit.label.includes(" — ") ? hit.label.split(" — ").slice(1).join(" — ").trim() : "BRS");
      const fileName = hit.fileName?.trim() || `${title}.mp3`;
      return {
        trackId: hit.id,
        previewTrackId: hit.id,
        fileName,
        title,
        artist,
        version: hit.version ?? null,
        genre: hit.styleSlug ? hit.styleSlug.replace(/-/g, " ") : null,
        bpm: hit.bpm ?? null,
        duration: null,
        year: null,
        coverUrl: null,
        relativePath: hit.relativePath || hit.path || "Atualizações",
        provider: "google_drive" as const,
        source: "vip" as const,
        previewAvailable: true,
        downloadAvailable: true,
      };
    });
  } catch (error) {
    console.error("[downloader-music-search] VIP search failed", error);
    return [];
  }
}

async function searchBrsProductions(q: string, limit: number): Promise<DownloaderSearchTrack[]> {
  if (limit <= 0) return [];
  const loose = q.replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim() || q;
  try {
    const rows = await prisma.brsProduction.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: loose, mode: "insensitive" } },
          { artist: { contains: loose, mode: "insensitive" } },
          { producer: { contains: loose, mode: "insensitive" } },
          { genre: { contains: loose, mode: "insensitive" } },
          { versionType: { contains: loose, mode: "insensitive" } },
          { versionLabel: { contains: loose, mode: "insensitive" } },
          { fileName: { contains: loose, mode: "insensitive" } },
        ],
      },
      include: { producerRef: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return rows.map((row) => {
      const bpm = row.bpm ? Number.parseInt(row.bpm.replace(/\D/g, ""), 10) : NaN;
      const producerSlug = row.producerRef?.slug || row.producerRef?.name || row.producer;
      const previewId = row.audioFileId;
      const downloadId = row.downloadFileId?.trim() || row.audioFileId;
      return {
        trackId: downloadId,
        previewTrackId: previewId,
        fileName: row.fileName,
        title: row.title,
        artist: row.artist || row.producer,
        version: row.versionLabel || row.versionType || null,
        genre: row.genre,
        bpm: Number.isFinite(bpm) ? bpm : null,
        duration: durationToSeconds(row.duration),
        year: row.publishedAt.getUTCFullYear(),
        coverUrl: catalogMediaUrl(row.coverFileId) || row.coverUrl || null,
        relativePath: `Produções BRS/${producerSlug}`.slice(0, 900),
        provider: "google_drive" as const,
        source: "brs_production" as const,
        previewAvailable: true,
        downloadAvailable: true,
      };
    });
  } catch {
    return [];
  }
}
