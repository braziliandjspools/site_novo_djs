import "server-only";
import { prisma } from "./prisma";
import { catalogMediaUrl } from "./catalog-media";
import { folderHref, isUpdateDateFolderName } from "./vip-music-slugs";
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
  /** Caminho legível do acervo no site (ex.: SETEMBRO 2026 · Pool · Funk). */
  collectionLabel: string;
  /** URL relativa no site para abrir a música no catálogo. */
  catalogPath: string;
  provider: "google_drive";
  source: "vip" | "brs_production";
  previewAvailable: boolean;
  downloadAvailable: boolean;
};

/** Only published BRS productions may stream outside the VIP Drive tree. */
export async function isPublishedBrsProductionDriveFile(fileId: string): Promise<boolean> {
  try {
    const production = await prisma.brsProduction.findFirst({
      where: {
        isPublished: true,
        OR: [{ audioFileId: fileId }, { downloadFileId: fileId }],
      },
      select: { id: true },
    });
    return Boolean(production);
  } catch {
    return false;
  }
}

/**
 * Pastas de dia (ex.: 25-set-2026 / 25-09-2026) abrem a tabela de faixas no site.
 * Não dá para anexar /pop ou /pool depois — esses níveis não existem na URL.
 */
function vipCatalogPath(input: {
  monthSlug: string;
  weekSlug?: string;
  styleSlug?: string;
  trackId: string;
}) {
  const segments: string[] = [];
  const year = input.monthSlug.match(/-(20\d{2})$/)?.[1];
  if (year) segments.push(year);
  if (input.monthSlug) segments.push(input.monthSlug);

  const weekSlug = input.weekSlug?.trim() || "";
  if (weekSlug) {
    segments.push(weekSlug);
    // Dia de atualização → linka no dia (site agrega pools/estilos na tabela).
    if (isUpdateDateFolderName(weekSlug)) {
      return `${folderHref(segments)}?faixa=${encodeURIComponent(input.trackId)}`;
    }
    // Semana / subpasta navegável → inclui o estilo quando existir.
    if (input.styleSlug) segments.push(input.styleSlug);
  } else if (input.styleSlug) {
    segments.push(input.styleSlug);
  }

  const base = segments.length > 0 ? folderHref(segments) : "/musicas/atualizacoes";
  return `${base}?faixa=${encodeURIComponent(input.trackId)}`;
}

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
      recentDays: 10,
    });

    return tracks.slice(0, limit).map((hit) => {
      const title = hit.title?.trim() || hit.label.split(" — ")[0]?.trim() || hit.label;
      const artist =
        hit.artist?.trim() ||
        (hit.label.includes(" — ") ? hit.label.split(" — ").slice(1).join(" — ").trim() : "BRS");
      const fileName = hit.fileName?.trim() || `${title}.mp3`;
      const collectionLabel = hit.path?.trim() || hit.relativePath || "Atualizações VIP";
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
        coverUrl: `/api/musicas/tag-cover/${encodeURIComponent(hit.id)}`,
        relativePath: hit.relativePath || hit.path || "Atualizações",
        collectionLabel,
        catalogPath: vipCatalogPath({
          monthSlug: hit.monthSlug,
          weekSlug: hit.weekSlug,
          styleSlug: hit.styleSlug,
          trackId: hit.id,
        }),
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
      select: {
        slug: true,
        title: true,
        artist: true,
        producer: true,
        genre: true,
        versionType: true,
        versionLabel: true,
        fileName: true,
        bpm: true,
        duration: true,
        publishedAt: true,
        audioFileId: true,
        downloadFileId: true,
        coverFileId: true,
        coverUrl: true,
        producerRef: { select: { slug: true, name: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return rows.map((row) => {
      const bpm = row.bpm ? Number.parseInt(row.bpm.replace(/\D/g, ""), 10) : NaN;
      const producerSlug = row.producerRef?.slug || row.producerRef?.name || row.producer;
      const previewId = row.audioFileId;
      const downloadId = row.downloadFileId?.trim() || row.audioFileId;
      const collectionLabel = `Produções BRS · ${row.producer || producerSlug}`;
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
        coverUrl:
          catalogMediaUrl(row.coverFileId) ||
          row.coverUrl ||
          `/api/musicas/tag-cover/${encodeURIComponent(previewId)}`,
        relativePath: `Produções BRS/${producerSlug}`.slice(0, 900),
        collectionLabel,
        catalogPath: `/m/${encodeURIComponent(row.slug)}`,
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
