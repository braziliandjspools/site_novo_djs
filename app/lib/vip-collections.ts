import { listDriveFolderChildren, listDriveFolderParents } from "./google-drive";
import { findFolderCover, isDriveAudioFile, isFolderCoverFile } from "./folder-cover";
import {
  GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID,
  GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID,
} from "./site";
import {
  listVipMusicFolders,
  type VipMusicCatalogResponse,
  type VipMusicFolder,
} from "./vip-music-catalog";
import { displayFolderName, findFolderBySlug, slugifyFolderName } from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";

const COLLECTIONS_ROOT_NAME_RE = /^(colec[oõ]es|collections|discografias|[aá]lbuns|albums)(\b|$)/i;

export type CollectionListItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  albumCount: number;
  trackCount: number;
  coverFileId: string | null;
  coverUrl: string | null;
};

export type CollectionChildItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  folderCount: number;
  trackCount: number;
  level: "folders" | "tracks";
  coverFileId: string | null;
  coverUrl: string | null;
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
  coverFileId: string | null;
  coverUrl: string | null;
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
    slug === "albuns" ||
    slug.startsWith("colecoes-") ||
    slug.startsWith("discografias-")
  );
}

/**
 * Procura ÁLBUNS também dentro de pastas organizadoras, por exemplo:
 * Brazilian Remix Service → novidades → ÁLBUNS.
 * Limita a busca a poucos níveis para não percorrer o acervo inteiro.
 */
async function findCollectionsRootBelow(startFolderId: string): Promise<string | null> {
  let level = [startFolderId];
  const visited = new Set<string>();

  for (let depth = 0; depth < 3 && level.length > 0; depth += 1) {
    const childrenByParent = await Promise.all(
      level.map(async (parentId) => {
        if (visited.has(parentId)) return [];
        visited.add(parentId);
        try {
          return (await listDriveFolderChildren(parentId)).filter(
            (item) => item.mimeType === FOLDER_MIME,
          );
        } catch {
          return [];
        }
      }),
    );
    const children = childrenByParent.flat();
    const match = children.find((item) => looksLikeCollectionsRoot(item.name));
    if (match) return match.id;
    level = children.map((item) => item.id);
  }

  return null;
}

export async function getCollectionsRootFolderId(): Promise<string | null> {
  if (GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID) {
    return GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID;
  }

  if (cachedCollectionsRootId !== undefined) {
    return cachedCollectionsRootId;
  }

  // Primeiro procura entre as pastas exibidas na raiz atual do acervo.
  const roots = await listVipMusicFolders();
  const match = roots.find((folder) => looksLikeCollectionsRoot(folder.name));
  if (match) {
    cachedCollectionsRootId = match.id;
    return cachedCollectionsRootId;
  }

  // Procura dentro da raiz configurada, incluindo a estrutura
  // "Brazilian Remix Service → novidades → ÁLBUNS".
  if (GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID) {
    const nestedMatch = await findCollectionsRootBelow(GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID);
    if (nestedMatch) {
      cachedCollectionsRootId = nestedMatch;
      return cachedCollectionsRootId;
    }
  }

  // Também verifica as pastas irmãs da raiz configurada.
  try {
    const parents = await listDriveFolderParents(GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID || "");
    for (const parentId of parents) {
      const siblings = await listDriveFolderChildren(parentId);
      const sibling = siblings.find(
        (item) => item.mimeType === FOLDER_MIME && looksLikeCollectionsRoot(item.name),
      );
      if (sibling) {
        cachedCollectionsRootId = sibling.id;
        return cachedCollectionsRootId;
      }

      // Ex.: a raiz configurada é uma pasta dentro de "novidades",
      // onde ÁLBUNS também pode estar um nível abaixo.
      const nestedMatch = await findCollectionsRootBelow(parentId);
      if (nestedMatch) {
        cachedCollectionsRootId = nestedMatch;
        return cachedCollectionsRootId;
      }
    }
  } catch {
    // O catálogo principal continua funcionando se a consulta ao pai falhar.
  }

  cachedCollectionsRootId = null;
  return cachedCollectionsRootId;
}

async function countFolderContents(folderId: string) {
  const children = await listDriveFolderChildren(folderId);
  const folders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const tracks = children.filter((item) => isDriveAudioFile(item) && !isFolderCoverFile(item));
  const cover = children.find((item) => isFolderCoverFile(item));
  return {
    folderCount: folders.length,
    trackCount: tracks.length,
    level: (folders.length > 0 ? "folders" : "tracks") as "folders" | "tracks",
    coverFileId: cover?.id ?? null,
    coverUrl: cover ? `/api/musicas/cover/${encodeURIComponent(cover.id)}` : null,
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
      let coverFileId: string | null = null;
      let coverUrl: string | null = null;
      try {
        const stats = await countFolderContents(folder.id);
        albumCount = stats.folderCount;
        coverFileId = stats.coverFileId;
        coverUrl = stats.coverUrl;
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
        coverFileId,
        coverUrl,
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
      let coverFileId: string | null = null;
      let coverUrl: string | null = null;
      try {
        const stats = await countFolderContents(folder.id);
        folderCount = stats.folderCount;
        trackCount = stats.trackCount;
        level = stats.level;
        coverFileId = stats.coverFileId;
        coverUrl = stats.coverUrl;
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
        coverFileId,
        coverUrl,
      } satisfies CollectionChildItem;
    }),
  );
}

export async function resolveCollectionsPath(slugParam: string): Promise<CollectionsResolveResult> {
  const rootId = await getCollectionsRootFolderId();
  const segments = slugParam.split("/").filter(Boolean);

  const emptyCover = { coverFileId: null as string | null, coverUrl: null as string | null };

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
      ...emptyCover,
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
  const cover = await findFolderCover(folderId);

  const childFolders = await listVipMusicFolders(folderId);
  if (childFolders.length === 0) {
    const { getVipMusicTracksPaginated } = await import("./vip-music-catalog");
    const page = await getVipMusicTracksPaginated(folderId, folderName, 1, 50);

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
      tracks: page.tracks,
      albumCount: 0,
      trackCount: page.total,
      coverFileId: cover?.fileId ?? null,
      coverUrl: cover?.coverUrl ?? null,
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
    coverFileId: cover?.fileId ?? null,
    coverUrl: cover?.coverUrl ?? null,
  };
}
