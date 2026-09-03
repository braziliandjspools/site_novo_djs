import {
  listDriveAudioInFolder,
  listDriveFolderChildren,
  listDriveSubfolders,
  parseTrackMeta,
  type PreviewTrack,
} from "./google-drive";
import { GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID } from "./site";
import { sortVipChildFolders } from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";

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

export function getVipMusicRootFolderId() {
  return GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID.trim();
}

export function isVipMusicCatalogConfigured() {
  return Boolean(getVipMusicRootFolderId());
}

export async function listVipMusicFolders(parentFolderId?: string): Promise<VipMusicFolder[]> {
  const rootId = getVipMusicRootFolderId();
  if (!rootId) return [];

  const targetId = parentFolderId && parentFolderId !== "root" ? parentFolderId : rootId;
  const subfolders = await listDriveSubfolders(targetId);

  return sortVipChildFolders(
    subfolders.map((folder) => ({ id: folder.id, name: folder.name })),
  );
}

async function getDriveCatalog(folderId: string, folderName: string): Promise<VipMusicCatalogResponse> {
  const rootId = getVipMusicRootFolderId();
  const children = await listDriveFolderChildren(folderId);
  const subfolders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const audioFiles = children.filter((item) => item.mimeType !== FOLDER_MIME);

  if (subfolders.length > 0) {
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
      tracks: [],
    };
  }

  const tracks: PreviewTrack[] = audioFiles
    .map((file) => ({
      id: file.id,
      pack: folderName,
      fileName: file.name,
      ...parseTrackMeta(file.name),
    }))
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

export async function getVipMusicTracks(folderId: string, folderName: string): Promise<PreviewTrack[]> {
  const files = await listDriveAudioInFolder(folderId);
  return files
    .map((file) => ({
      id: file.id,
      pack: folderName,
      fileName: file.name,
      ...parseTrackMeta(file.name),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
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
