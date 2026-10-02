import "server-only";
import { listDriveFolderChildren, parseTrackMeta } from "./google-drive";
import { getTrackDisplayMetadata } from "./track-display-metadata";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import { prisma } from "./prisma";
import { catalogMediaUrl } from "./catalog-media";
import { listVipMusicFolders } from "./vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
} from "./vip-music-slugs";

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

const FOLDER_MIME = "application/vnd.google-apps.folder";
const STYLE_SCAN_CONCURRENCY = 10;
const DEFAULT_LIMIT = 24;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function matches(text: string, query: string) {
  const hay = normalize(text);
  const parts = normalize(query).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((part) => hay.includes(part));
}

function yearFromLabel(label: string): number | null {
  const match = label.match(/\b(20\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100 ? year : null;
}

function durationToSeconds(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const parts = value.trim().split(":").map((part) => Number(part));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return null;
}

type StyleScanTarget = {
  id: string;
  name: string;
  monthLabel: string;
  weekLabel?: string;
  year: number | null;
};

/**
 * Pesquisa faixas no catálogo VIP (via indexação/listagens do servidor)
 * e nas produções BRS publicadas. O app nunca fala com o Drive.
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

  const productions = await searchBrsProductions(q, max);
  for (const item of productions) {
    if (seen.has(item.trackId)) continue;
    seen.add(item.trackId);
    results.push(item);
    if (results.length >= max) break;
  }

  if (results.length < max) {
    const vip = await searchVipUpdateTracks(q, max - results.length);
    for (const item of vip) {
      if (seen.has(item.trackId)) continue;
      seen.add(item.trackId);
      results.push(item);
      if (results.length >= max) break;
    }
  }

  return { results, total: results.length };
}

async function searchBrsProductions(q: string, limit: number): Promise<DownloaderSearchTrack[]> {
  if (limit <= 0) return [];
  try {
    const rows = await prisma.brsProduction.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { artist: { contains: q, mode: "insensitive" } },
          { producer: { contains: q, mode: "insensitive" } },
          { genre: { contains: q, mode: "insensitive" } },
          { versionType: { contains: q, mode: "insensitive" } },
          { versionLabel: { contains: q, mode: "insensitive" } },
          { fileName: { contains: q, mode: "insensitive" } },
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

async function searchVipUpdateTracks(q: string, limit: number): Promise<DownloaderSearchTrack[]> {
  if (limit <= 0) return [];

  const styleTargets: StyleScanTarget[] = [];
  const months = await listVipMusicFolders();
  const monthTrees = await mapPool(months, 6, async (month) => {
    const monthLabel = displayFolderName(month.name);
    const monthChildren = await listVipMusicFolders(month.id);
    return { month, monthLabel, monthChildren, year: yearFromLabel(month.name) };
  });

  for (const { monthLabel, monthChildren, year } of monthTrees) {
    if (childrenAreWeekFolders(monthChildren)) {
      const weekTrees = await mapPool(monthChildren, 6, async (week) => {
        const weekLabel = displayFolderName(week.name);
        const styles = await listVipMusicFolders(week.id);
        return { weekLabel, styles };
      });
      for (const { weekLabel, styles } of weekTrees) {
        for (const style of styles) {
          styleTargets.push({
            id: style.id,
            name: style.name,
            monthLabel,
            weekLabel,
            year,
          });
        }
      }
      continue;
    }

    for (const style of monthChildren) {
      styleTargets.push({
        id: style.id,
        name: style.name,
        monthLabel,
        year,
      });
    }
  }

  return scanStyleTracksRich(styleTargets, q, limit);
}

async function scanStyleTracksRich(
  targets: StyleScanTarget[],
  q: string,
  limit: number,
): Promise<DownloaderSearchTrack[]> {
  if (limit <= 0 || targets.length === 0) return [];

  const hits: DownloaderSearchTrack[] = [];
  let stop = false;

  await mapPool(targets, STYLE_SCAN_CONCURRENCY, async (style) => {
    if (stop || hits.length >= limit) return;

    try {
      const children = await listDriveFolderChildren(style.id);
      if (stop || hits.length >= limit) return;

      const styleLabel = displayFolderName(style.name);
      const pathParts = [style.monthLabel, style.weekLabel, styleLabel].filter(Boolean) as string[];
      const relativePath = pathParts.join("/").slice(0, 900);

      const considerFile = (file: { id: string; name: string; mimeType?: string | null }) => {
        if (hits.length >= limit) {
          stop = true;
          return;
        }
        const mimeType = file.mimeType ?? "";
        if (!isDriveAudioFile({ name: file.name, mimeType })) return;
        const meta = parseTrackMeta(file.name);
        const haystack = [meta.title, meta.artist, meta.version, style.name, file.name].join(" ");
        if (!matches(haystack, q)) return;
        const display = getTrackDisplayMetadata({
          fileName: file.name,
          ...meta,
        });
        hits.push({
          trackId: file.id,
          previewTrackId: file.id,
          fileName: file.name,
          title: display.title,
          artist: display.artist,
          version: meta.version,
          genre: styleLabel,
          bpm: meta.bpmFrom,
          duration: null,
          year: style.year,
          coverUrl: null,
          relativePath,
          provider: "google_drive",
          source: "vip",
          previewAvailable: true,
          downloadAvailable: true,
        });
      };

      for (const file of children) {
        considerFile(file);
        if (stop) return;
      }

      const nestedFolders = children.filter((item) => item.mimeType === FOLDER_MIME).slice(0, 12);
      if (nestedFolders.length === 0 || hits.length >= limit) return;

      await mapPool(nestedFolders, 4, async (folder) => {
        if (stop || hits.length >= limit) return;
        try {
          const nested = await listDriveFolderChildren(folder.id);
          for (const file of nested) {
            considerFile(file);
            if (stop) return;
          }
        } catch {
          /* pasta inacessível */
        }
      });
    } catch {
      /* pasta inacessível */
    }
  });

  return hits.slice(0, limit);
}
