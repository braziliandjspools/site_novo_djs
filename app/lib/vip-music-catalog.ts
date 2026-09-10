import {
  listDriveFolderChildren,
  parseTrackMeta,
  type PreviewPlaylist,
  type PreviewTrack,
} from "./google-drive";
import { GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID } from "./site";
import {
  childrenAreWeekFolders,
  displayFolderName,
  slugifyFolderName,
  sortVipChildFolders,
} from "./vip-music-slugs";
import { findFolderCover, folderCoverUrl, isDriveAudioFile, isFolderCoverFile } from "./folder-cover";
import { mapPool } from "./map-pool";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const MAX_TRACK_WALK_DEPTH = 12;
/** Pastas irmãs no deep-walk — paraleliza sem saturar a Drive API. */
const TRACK_WALK_CONCURRENCY = 8;

export type VipMusicFolder = {
  id: string;
  name: string;
};

export type VipMusicCatalogItem = VipMusicFolder & {
  type: "folder";
  coverUrl?: string | null;
};

export type VipMusicCatalogResponse = {
  configured: boolean;
  rootFolderId: string;
  rootFolderName: string;
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  tracks: PreviewTrack[];
  coverUrl?: string | null;
};

type DriveChild = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
};

function parseDriveSizeBytes(size?: string | number | null): number | null {
  if (size == null || size === "") return null;
  const n = typeof size === "number" ? size : Number(size);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getVipMusicRootFolderId() {
  return GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID.trim();
}

export function isVipMusicCatalogConfigured() {
  return Boolean(getVipMusicRootFolderId());
}

function toPreviewTrack(file: DriveChild, packName: string): PreviewTrack {
  return {
    id: file.id,
    pack: packName,
    fileName: file.name,
    modifiedAt: file.modifiedTime ?? null,
    sizeBytes: parseDriveSizeBytes(file.size),
    ...parseTrackMeta(file.name),
  };
}

export async function listVipMusicFolders(parentFolderId?: string): Promise<VipMusicFolder[]> {
  const rootId = getVipMusicRootFolderId();
  if (!rootId) return [];

  const targetId = parentFolderId && parentFolderId !== "root" ? parentFolderId : rootId;
  const children = await listDriveFolderChildren(targetId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);

  return sortVipChildFolders(
    subfolders.map((folder) => ({ id: folder.id, name: folder.name })),
  );
}

/**
 * Percorre a pasta e todas as subpastas até achar arquivos de áudio.
 */
async function collectTracksDeep(
  folderId: string,
  packName: string,
  depth = 0,
  seen = new Set<string>(),
): Promise<PreviewTrack[]> {
  if (depth > MAX_TRACK_WALK_DEPTH) return [];
  if (seen.has(folderId)) return [];
  seen.add(folderId);

  const children = await listDriveFolderChildren(folderId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const audioFiles = children.filter((item) => isDriveAudioFile(item));

  const tracks = audioFiles.map((file) => toPreviewTrack(file, packName));

  if (subfolders.length > 0) {
    const nestedLists = await mapPool(subfolders, TRACK_WALK_CONCURRENCY, (folder) =>
      collectTracksDeep(folder.id, folder.name, depth + 1, seen),
    );
    for (const nested of nestedLists) {
      tracks.push(...nested);
    }
  }

  return tracks;
}

async function getDriveCatalog(folderId: string, folderName: string): Promise<VipMusicCatalogResponse> {
  const rootId = getVipMusicRootFolderId();
  const children = await listDriveFolderChildren(folderId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const audioFiles = children.filter((item) => isDriveAudioFile(item));
  const coverFile = children.find((item) => isFolderCoverFile(item));
  const coverUrl = coverFile ? folderCoverUrl(coverFile.id) : null;

  // Há subpastas: navega por pastas; se também houver áudio no mesmo nível, inclui as faixas.
  if (subfolders.length > 0) {
    const directTracks = audioFiles
      .map((file) => toPreviewTrack(file, folderName))
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

    const sorted = sortVipChildFolders(subfolders.map((folder) => ({ id: folder.id, name: folder.name })));
    // Semanas/meses: sem capa — evita N+1 listagens no Drive.
    const loadCovers = !childrenAreWeekFolders(sorted) && sorted.length <= 48;
    const covers = loadCovers
      ? await Promise.all(sorted.map((folder) => findFolderCover(folder.id)))
      : sorted.map(() => null);
    const items: VipMusicCatalogItem[] = sorted.map((folder, index) => ({
      ...folder,
      type: "folder" as const,
      coverUrl: covers[index]?.coverUrl ?? null,
    }));

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "folders",
      items,
      tracks: directTracks,
      coverUrl,
    };
  }

  // Folha sem subpastas: usa a listagem já feita (não re-walk).
  const tracks = audioFiles
    .map((file) => toPreviewTrack(file, folderName))
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

  return {
    configured: true,
    rootFolderId: rootId,
    rootFolderName: "2026",
    folderId,
    folderName,
    level: "tracks",
    items: [],
    tracks,
    coverUrl,
  };
}

export async function getVipMusicCatalog(
  folderId?: string,
  folderName?: string,
): Promise<VipMusicCatalogResponse> {
  const rootId = getVipMusicRootFolderId();

  if (!rootId) {
    return {
      configured: false,
      rootFolderId: "",
      rootFolderName: "Acervo",
      folderId: "root",
      folderName: "Acervo VIP",
      level: "folders",
      items: [],
      tracks: [],
      coverUrl: null,
    };
  }

  const targetId = folderId && folderId !== "root" ? folderId : rootId;
  const resolvedName = folderName?.trim() || (targetId === rootId ? "2026" : "Pasta");

  try {
    return await getDriveCatalog(targetId, resolvedName);
  } catch {
    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: "2026",
      folderId: targetId,
      folderName: resolvedName,
      level: "folders",
      items: [],
      tracks: [],
      coverUrl: null,
    };
  }
}

export const VIP_MUSIC_TRACKS_PAGE_SIZE = 50;

/** Lista todas as faixas da pasta, incluindo subpastas aninhadas até os MP3. */
export async function getVipMusicTracks(folderId: string, folderName: string): Promise<PreviewTrack[]> {
  const tracks = await collectTracksDeep(folderId, folderName);
  return tracks.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

export type VipMusicTrackPage = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export async function getVipMusicTracksPaginated(
  folderId: string,
  folderName: string,
  page = 1,
  limit = VIP_MUSIC_TRACKS_PAGE_SIZE,
): Promise<VipMusicTrackPage> {
  const all = await getVipMusicTracks(folderId, folderName);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : VIP_MUSIC_TRACKS_PAGE_SIZE;
  const start = (safePage - 1) * safeLimit;
  const pageTracks = all.slice(start, start + safeLimit);

  // Tags embutidas baixam ~1MB/faixa via a function da Vercel (Fast Origin Transfer).
  // Desligado por padrão — o display usa getTrackDisplayMetadata no nome do arquivo.
  // Ative com VIP_MUSIC_ENRICH_DRIVE_TAGS=1 se precisar de capa/artista das tags.
  const enrichTags = process.env.VIP_MUSIC_ENRICH_DRIVE_TAGS === "1";
  const tracks = enrichTags
    ? await (await import("./audio-file-tags")).enrichTracksWithDriveTags(pageTracks)
    : pageTracks;

  return {
    tracks,
    total: all.length,
    page: safePage,
    limit: safeLimit,
    hasMore: start + tracks.length < all.length,
  };
}

export const VIP_MUSIC_FEED_PAGE_SIZE = 6;
/** Faixas iniciais por pack no feed / blocos de atualizações (resto via “Carregar mais”). */
export const VIP_MUSIC_FEED_TRACKS_PAGE_SIZE = 30;

export type VipMusicFeedPack = {
  id: string;
  name: string;
  slugSegments: string[];
  monthName: string;
  weekName: string | null;
  modifiedAt: string | null;
  coverUrl: string | null;
  tracks: PreviewTrack[];
  trackCount: number;
  totalSizeBytes: number;
};

export type VipMusicFeedResponse = {
  packs: VipMusicFeedPack[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type FeedCandidate = {
  id: string;
  name: string;
  slugSegments: string[];
  monthName: string;
  weekName: string | null;
  modifiedAt: number;
};

async function listVipMusicFeedCandidates(options?: {
  monthSlug?: string;
  weekSlug?: string;
}): Promise<FeedCandidate[]> {
  const months = await listVipMusicFolders();
  if (!months.length) return [];

  const monthSlug = options?.monthSlug?.trim() || null;
  const weekSlug = options?.weekSlug?.trim() || null;
  const scopedMonths = monthSlug
    ? months.filter((month) => slugifyFolderName(month.name) === monthSlug)
    : months.slice(0, 3);

  const candidates: FeedCandidate[] = [];

  for (const month of scopedMonths) {
    const monthName = displayFolderName(month.name);
    const monthSeg = slugifyFolderName(month.name);
    const children = await listDriveFolderChildren(month.id);
    const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
    const sorted = sortVipChildFolders(subfolders.map((folder) => ({ id: folder.id, name: folder.name })));
    const modifiedById = new Map(
      subfolders.map((folder) => [folder.id, folder.modifiedTime ? Date.parse(folder.modifiedTime) : 0]),
    );

    if (childrenAreWeekFolders(sorted)) {
      const weeks = weekSlug
        ? sorted.filter((week) => slugifyFolderName(week.name) === weekSlug)
        : [...sorted].reverse();
      for (const week of weeks) {
        const weekName = displayFolderName(week.name);
        const weekSeg = slugifyFolderName(week.name);
        const weekChildren = await listDriveFolderChildren(week.id);
        for (const style of weekChildren.filter((item) => item.mimeType === FOLDER_MIME)) {
          candidates.push({
            id: style.id,
            name: displayFolderName(style.name),
            slugSegments: [monthSeg, weekSeg, slugifyFolderName(style.name)],
            monthName,
            weekName,
            modifiedAt: style.modifiedTime ? Date.parse(style.modifiedTime) : modifiedById.get(week.id) ?? 0,
          });
        }
      }
    } else {
      for (const style of sorted) {
        candidates.push({
          id: style.id,
          name: displayFolderName(style.name),
          slugSegments: [monthSeg, slugifyFolderName(style.name)],
          monthName,
          weekName: null,
          modifiedAt: modifiedById.get(style.id) ?? 0,
        });
      }
    }
  }

  const hasTimestamps = candidates.some((item) => item.modifiedAt > 0);
  if (hasTimestamps) {
    candidates.sort((a, b) => b.modifiedAt - a.modifiedAt);
  }
  return candidates;
}

export async function getVipMusicUpdatesFeed(options?: {
  page?: number;
  pageSize?: number;
  monthSlug?: string;
  weekSlug?: string;
}): Promise<VipMusicFeedResponse> {
  const pageSizeRaw = options?.pageSize ?? VIP_MUSIC_FEED_PAGE_SIZE;
  const pageSize = Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 12) : VIP_MUSIC_FEED_PAGE_SIZE;
  const pageRaw = options?.page ?? 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const candidates = await listVipMusicFeedCandidates({
    monthSlug: options?.monthSlug,
    weekSlug: options?.weekSlug,
  });
  const total = candidates.length;
  const start = (page - 1) * pageSize;
  const slice = candidates.slice(start, start + pageSize);

  const packs = await mapPool(slice, 3, async (candidate) => {
    const pageResult = await getVipMusicTracksPaginated(
      candidate.id,
      candidate.name,
      1,
      VIP_MUSIC_FEED_TRACKS_PAGE_SIZE,
    );
    const totalSizeBytes = pageResult.tracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0);
    return {
      id: candidate.id,
      name: candidate.name,
      slugSegments: candidate.slugSegments,
      monthName: candidate.monthName,
      weekName: candidate.weekName,
      modifiedAt: candidate.modifiedAt > 0 ? new Date(candidate.modifiedAt).toISOString() : null,
      coverUrl: null,
      tracks: pageResult.tracks,
      trackCount: pageResult.total,
      totalSizeBytes,
    } satisfies VipMusicFeedPack;
  });

  return {
    packs,
    page,
    pageSize,
    total,
    hasMore: start + packs.length < total,
  };
}

/**
 * Três pastas mais recentes do acervo VIP (estilo/pack) para o preview da home.
 * Ordena por `modifiedTime` do Drive quando disponível; senão prioriza meses/semanas mais novos.
 */
export async function getLatestVipPreviewPlaylists(limit = 3): Promise<PreviewPlaylist[]> {
  const { getPreviewPlaylists } = await import("./google-drive");

  if (!isVipMusicCatalogConfigured()) {
    return (await getPreviewPlaylists()).slice(0, limit);
  }

  const candidates = await listVipMusicFeedCandidates();
  if (!candidates.length) {
    return (await getPreviewPlaylists()).slice(0, limit);
  }

  const playlists: PreviewPlaylist[] = [];
  for (const candidate of candidates) {
    if (playlists.length >= limit) break;
    const tracks = await getVipMusicTracks(candidate.id, candidate.name);
    if (!tracks.length) continue;
    playlists.push({
      id: candidate.id,
      name: candidate.weekName ? `${candidate.weekName} · ${candidate.name}` : candidate.name,
      tracks: tracks.slice(0, 50),
    });
  }

  if (playlists.length) return playlists;
  return (await getPreviewPlaylists()).slice(0, limit);
}
