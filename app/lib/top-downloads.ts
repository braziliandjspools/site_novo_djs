import "server-only";
import { prisma } from "./prisma";
import { parseTrackMeta } from "./google-drive";

export type TopDownloadTrack = {
  id: string;
  title: string;
  artist: string;
  pack: string;
  fileName: string;
  downloadCount: number;
  musicalKey: string | null;
  bpm: string | null;
  version: string | null;
  editType: string | null;
  relativePath: string | null;
  href: string;
  coverUrl: string | null;
};

function folderHrefFromRelativePath(relativePath: string | null | undefined) {
  if (!relativePath) return "/musicas/atualizacoes";
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  // remove filename
  if (parts.length <= 1) return "/musicas/atualizacoes";
  const folders = parts.slice(0, -1).slice(0, 3);
  const slug = folders
    .map((p) =>
      p
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("/");
  return slug ? `/musicas/atualizacoes/${slug}` : "/musicas/atualizacoes";
}

function packFromRelativePath(relativePath: string | null | undefined, fileName: string) {
  if (!relativePath) return "Atualizações";
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2] ?? "Atualizações";
  return fileName.replace(/\.[^.]+$/, "") || "Atualizações";
}

/** Mais baixadas via jobs do Downloader / plataforma (proxy de /musicas/atualizacoes). */
export async function getMostDownloadedTracks(limit = 12): Promise<TopDownloadTrack[]> {
  try {
    const grouped = await prisma.downloadJob.groupBy({
      by: ["fileId", "fileName"],
      _count: { _all: true },
      orderBy: { _count: { fileId: "desc" } },
      take: limit * 2,
    });

    if (!grouped.length) {
      return fallbackFromRecentPlaylists(limit);
    }

    const tracks: TopDownloadTrack[] = [];
    for (const row of grouped) {
      if (tracks.length >= limit) break;
      if (!row.fileId || !row.fileName) continue;

      const sample = await prisma.downloadJob.findFirst({
        where: { fileId: row.fileId },
        orderBy: { createdAt: "desc" },
        select: { relativePath: true, fileName: true },
      });

      const fileName = sample?.fileName || row.fileName;
      const relativePath = sample?.relativePath ?? null;
      const meta = parseTrackMeta(fileName);

      tracks.push({
        id: row.fileId,
        title: meta.title,
        artist: meta.artist,
        pack: packFromRelativePath(relativePath, fileName),
        fileName,
        downloadCount: row._count._all,
        musicalKey: meta.musicalKey,
        bpm: meta.bpm,
        version: meta.version,
        editType: meta.editType,
        relativePath,
        href: folderHrefFromRelativePath(relativePath),
        coverUrl: `/api/musicas/tag-cover/${row.fileId}`,
      });
    }

    if (tracks.length) return tracks;
    return fallbackFromRecentPlaylists(limit);
  } catch (err) {
    console.error("[top-downloads]", err);
    return fallbackFromRecentPlaylists(limit);
  }
}

async function fallbackFromRecentPlaylists(limit: number): Promise<TopDownloadTrack[]> {
  try {
    const { getLatestVipPreviewPlaylists } = await import("./vip-music-catalog");
    const playlists = await getLatestVipPreviewPlaylists(2);
    const flat = playlists.flatMap((p) =>
      p.tracks.map((t, i) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        pack: t.pack || p.name,
        fileName: t.fileName ?? `${t.title}.mp3`,
        downloadCount: Math.max(1, 40 - i),
        musicalKey: t.musicalKey,
        bpm: t.bpm,
        version: t.version,
        editType: t.editType,
        relativePath: null,
        href: "/musicas/atualizacoes",
        coverUrl: t.coverUrl ?? `/api/musicas/tag-cover/${t.id}`,
      })),
    );
    return flat.slice(0, limit);
  } catch {
    return [];
  }
}

type TopDownloadsCache = {
  at: number;
  tracks: TopDownloadTrack[];
};

let topDownloadsCache: TopDownloadsCache | null = null;
const TOP_DOWNLOADS_TTL_MS = 5_000;

/** Cache curto para ranking + whitelist do stream público. */
export async function getMostDownloadedTracksCached(limit = 12): Promise<TopDownloadTrack[]> {
  if (topDownloadsCache && Date.now() - topDownloadsCache.at < TOP_DOWNLOADS_TTL_MS) {
    return topDownloadsCache.tracks.slice(0, limit);
  }
  const tracks = await getMostDownloadedTracks(limit);
  topDownloadsCache = { at: Date.now(), tracks };
  return tracks;
}

export async function isPublicHomePreviewTrackId(fileId: string): Promise<boolean> {
  const tracks = await getMostDownloadedTracksCached(12);
  return tracks.some((t) => t.id === fileId);
}

/** Invalida cache após novos downloads (opcional). */
export function invalidateTopDownloadsCache() {
  topDownloadsCache = null;
}
