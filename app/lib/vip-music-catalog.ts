import {
  listDriveFolderChildren,
  parseTrackMeta,
  type PreviewTrack,
} from "./google-drive";
import { GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID } from "./site";
import { sortVipChildFolders } from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|m4a|aac|ogg)$/i;
const MAX_TRACK_WALK_DEPTH = 12;

export type VipMusicFolder = {
  id: string;
  name: string;
};

export type VipMusicCatalogItem = VipMusicFolder & {
  type: "folder";
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

function isDriveAudioFile(file: DriveChild) {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.test(file.name);
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

  for (const folder of subfolders) {
    const nested = await collectTracksDeep(folder.id, folder.name, depth + 1, seen);
    tracks.push(...nested);
  }

  return tracks;
}

async function getDriveCatalog(folderId: string, folderName: string): Promise<VipMusicCatalogResponse> {
  const rootId = getVipMusicRootFolderId();
  const children = await listDriveFolderChildren(folderId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const audioFiles = children.filter((item) => isDriveAudioFile(item));

  // Há subpastas: navega por pastas; se também houver áudio no mesmo nível, inclui as faixas.
  if (subfolders.length > 0) {
    const directTracks = audioFiles
      .map((file) => toPreviewTrack(file, folderName))
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

    return {
      configured: true,
      rootFolderId: rootId,
      rootFolderName: folderId === rootId ? folderName : "2026",
      folderId,
      folderName,
      level: "folders",
      items: sortVipChildFolders(
        subfolders.map((folder) => ({
          id: folder.id,
          name: folder.name,
        })),
      ).map((folder) => ({
        ...folder,
        type: "folder" as const,
      })),
      tracks: directTracks,
    };
  }

  // Folha (ou só arquivos): desce a árvore por segurança e lista todos os MP3.
  const tracks = (await collectTracksDeep(folderId, folderName)).sort((a, b) =>
    a.title.localeCompare(b.title, "pt-BR"),
  );

  return {
    configured: true,
    rootFolderId: rootId,
    rootFolderName: "2026",
    folderId,
    folderName,
    level: "tracks",
    items: [],
    tracks,
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
  const tracks = all.slice(start, start + safeLimit);

  return {
    tracks,
    total: all.length,
    page: safePage,
    limit: safeLimit,
    hasMore: start + tracks.length < all.length,
  };
}
