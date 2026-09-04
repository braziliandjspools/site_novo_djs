import { listDriveFolderChildren } from "./google-drive";
import { GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID } from "./site";
import {
  listVipMusicFolders,
  type VipMusicCatalogResponse,
  type VipMusicFolder,
} from "./vip-music-catalog";
import { displayFolderName, findFolderBySlug, slugifyFolderName } from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const COLLECTIONS_ROOT_NAME_RE = /^(colec[oõ]es|collections|discografias)(\b|$)/i;

export type CollectionListItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  albumCount: number;
  trackCount: number;
};

export type CollectionChildItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  folderCount: number;
  trackCount: number;
  level: "folders" | "tracks";
};

export type CollectionsResolveResult = {
  configured: boolean;
  rootFolderId: string;
  folderId: string;
  folderName: string;
  displayName: string;
  level: "folders" | "tracks";
  slugSegments: string[];
  resolvedPath: { slug: string; id: string; name: string; displayName: string }[];
  items: CollectionChildItem[];
  tracks: VipMusicCatalogResponse["tracks"];
  albumCount: number;
  trackCount: number;
};

let cachedCollectionsRootId: string | null | undefined;

function looksLikeCollectionsRoot(name: string) {
  const cleaned = displayFolderName(name).trim();
  const slug = slugifyFolderName(cleaned);
  return (
    COLLECTIONS_ROOT_NAME_RE.test(cleaned) ||
    slug === "colecoes" ||
    slug === "collections" ||
    slug === "discografias" ||
    slug.startsWith("colecoes-") ||
    slug.startsWith("discografias-")
  );
}

export async function getCollectionsRootFolderId(): Promise<string | null> {
  if (GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID) {
    return GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID;
  }

  if (cachedCollectionsRootId !== undefined) {
    return cachedCollectionsRootId;
  }

  const roots = await listVipMusicFolders();
  const match = roots.find((folder) => looksLikeCollectionsRoot(folder.name));
  cachedCollectionsRootId = match?.id ?? null;
  return cachedCollectionsRootId;
}

async function countFolderContents(folderId: string) {
  const children = await listDriveFolderChildren(folderId);
  const folders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const tracks = children.filter((item) => item.mimeType !== FOLDER_MIME);
  return {
    folderCount: folders.length,
    trackCount: tracks.length,
    level: (folders.length > 0 ? "folders" : "tracks") as "folders" | "tracks",
  };
}

export async function listCollections(): Promise<{
  configured: boolean;
  rootFolderId: string | null;
  collections: CollectionListItem[];
}> {
  const rootId = await getCollectionsRootFolderId();
  if (!rootId) {
    return { configured: false, rootFolderId: null, collections: [] };
  }

  const folders = await listVipMusicFolders(rootId);
  const collections = await Promise.all(
    folders.map(async (folder) => {
      let albumCount = 0;
      let trackCount = 0;
      try {
        const stats = await countFolderContents(folder.id);
        albumCount = stats.folderCount;
        if (stats.level === "tracks") {
          trackCount = stats.trackCount;
        } else {
          const albums = await listVipMusicFolders(folder.id);
          const leafCounts = await Promise.all(
            albums.slice(0, 40).map(async (album) => {
              try {
                const albumStats = await countFolderContents(album.id);
                return albumStats.level === "tracks" ? albumStats.trackCount : 0;
              } catch {
                return 0;
              }
            }),
          );
          trackCount = leafCounts.reduce((sum, value) => sum + value, 0);
        }
      } catch {
        albumCount = 0;
        trackCount = 0;
      }

      return {
        id: folder.id,
        name: folder.name,
        displayName: displayFolderName(folder.name),
        slug: slugifyFolderName(folder.name),
        albumCount,
        trackCount,
      } satisfies CollectionListItem;
    }),
  );

  return {
    configured: true,
    rootFolderId: rootId,
    collections: collections.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "pt-BR", { numeric: true }),
    ),
  };
}

async function enrichChildren(folders: VipMusicFolder[]): Promise<CollectionChildItem[]> {
  return Promise.all(
    folders.map(async (folder) => {
      let folderCount = 0;
      let trackCount = 0;
      let level: "folders" | "tracks" = "folders";
      try {
        const stats = await countFolderContents(folder.id);
        folderCount = stats.folderCount;
        trackCount = stats.trackCount;
        level = stats.level;
      } catch {
        /* keep zeros */
      }

      return {
        id: folder.id,
        name: folder.name,
        displayName: displayFolderName(folder.name),
        slug: slugifyFolderName(folder.name),
        folderCount,
        trackCount,
        level,
      } satisfies CollectionChildItem;
    }),
  );
}

export async function resolveCollectionsPath(slugParam: string): Promise<CollectionsResolveResult> {
  const rootId = await getCollectionsRootFolderId();
  const segments = slugParam.split("/").filter(Boolean);

  if (!rootId) {
    return {
      configured: false,
      rootFolderId: "",
      folderId: "",
      folderName: "Coleções",
      displayName: "Coleções",
      level: "folders",
      slugSegments: segments,
      resolvedPath: [],
      items: [],
      tracks: [],
      albumCount: 0,
      trackCount: 0,
    };
  }

  let parentId = rootId;
  const resolvedPath: CollectionsResolveResult["resolvedPath"] = [];

  for (const segment of segments) {
    const folders = await listVipMusicFolders(parentId);
    const match = findFolderBySlug(folders, segment);
    if (!match) {
      const error = new Error("Pasta não encontrada.");
      (error as Error & { status?: number }).status = 404;
      throw error;
    }
    resolvedPath.push({
      slug: segment,
      id: match.id,
      name: match.name,
      displayName: displayFolderName(match.name),
    });
    parentId = match.id;
  }

  const target = resolvedPath.at(-1);
  const folderId = target?.id ?? rootId;
  const folderName = target?.name ?? "Coleções";

  // Detecção leve: se há subpastas, lista pastas; senão, é álbum de faixas.
  const childFolders = await listVipMusicFolders(folderId);
  if (childFolders.length === 0) {
    let trackCount = 0;
    try {
      const stats = await countFolderContents(folderId);
      trackCount = stats.trackCount;
    } catch {
      trackCount = 0;
    }

    return {
      configured: true,
      rootFolderId: rootId,
      folderId,
      folderName,
      displayName: displayFolderName(folderName),
      level: "tracks",
      slugSegments: segments,
      resolvedPath,
      items: [],
      tracks: [],
      albumCount: 0,
      trackCount,
    };
  }

  const items = await enrichChildren(childFolders);
  const albumCount = items.length;
  const trackCount = items.reduce((sum, item) => sum + item.trackCount, 0);

  return {
    configured: true,
    rootFolderId: rootId,
    folderId,
    folderName,
    displayName: displayFolderName(folderName),
    level: "folders",
    slugSegments: segments,
    resolvedPath,
    items,
    tracks: [],
    albumCount,
    trackCount,
  };
}
