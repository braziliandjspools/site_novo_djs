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
};

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

type LatestPreviewCandidate = {
  id: string;
  name: string;
  modifiedAt: number;
};

/**
 * Três pastas mais recentes do acervo VIP (estilo/pack) para o preview da home.
 * Ordena por `modifiedTime` do Drive quando disponível; senão prioriza meses/semanas mais novos.
 */
export async function getLatestVipPreviewPlaylists(limit = 3): Promise<PreviewPlaylist[]> {
  const { getPreviewPlaylists } = await import("./google-drive");

  if (!isVipMusicCatalogConfigured()) {
    return (await getPreviewPlaylists()).slice(0, limit);
  }

  const months = await listVipMusicFolders();
  if (!months.length) {
    return (await getPreviewPlaylists()).slice(0, limit);
  }

  const candidates: LatestPreviewCandidate[] = [];

  for (const month of months.slice(0, 2)) {
    const children = await listDriveFolderChildren(month.id);
    const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
    const sorted = sortVipChildFolders(subfolders.map((folder) => ({ id: folder.id, name: folder.name })));
    const modifiedById = new Map(
      subfolders.map((folder) => [folder.id, folder.modifiedTime ? Date.parse(folder.modifiedTime) : 0]),
    );

    if (childrenAreWeekFolders(sorted)) {
      for (const week of [...sorted].reverse()) {
        const weekChildren = await listDriveFolderChildren(week.id);
        for (const style of weekChildren.filter((item) => item.mimeType === FOLDER_MIME)) {
          candidates.push({
            id: style.id,
            name: `${displayFolderName(week.name)} · ${displayFolderName(style.name)}`,
            modifiedAt: style.modifiedTime ? Date.parse(style.modifiedTime) : modifiedById.get(week.id) ?? 0,
          });
        }
      }
    } else {
      for (const style of sorted) {
        candidates.push({
          id: style.id,
          name: displayFolderName(style.name),
          modifiedAt: modifiedById.get(style.id) ?? 0,
        });
      }
    }
  }

  const hasTimestamps = candidates.some((item) => item.modifiedAt > 0);
  if (hasTimestamps) {
    candidates.sort((a, b) => b.modifiedAt - a.modifiedAt);
  }

  const playlists: PreviewPlaylist[] = [];
  for (const candidate of candidates) {
    if (playlists.length >= limit) break;
    const tracks = await getVipMusicTracks(candidate.id, candidate.name);
    if (!tracks.length) continue;
    playlists.push({
      id: candidate.id,
      name: candidate.name,
      tracks: tracks.slice(0, 50),
    });
  }

  if (playlists.length) return playlists;
  return (await getPreviewPlaylists()).slice(0, limit);
}
