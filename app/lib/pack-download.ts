import {
  displayFolderName,
  findFolderBySlug,
} from "./vip-music-slugs";
import {
  getVipMusicCatalog,
  getVipMusicRootFolderId,
  listVipMusicFolders,
  type VipMusicFolder,
} from "./vip-music-catalog";
import { getCollectionsRootFolderId } from "./vip-collections";
import { ensureAudioExtension, type PreviewTrack } from "./google-drive";
import { createDownloadJobsBatch, type DownloadJobInput } from "./downloader";
import { withForcedFolderTree } from "./force-folder-tree";
import { parsePackDownloadInput } from "./pack-download-link";
import { mapPool } from "./map-pool";
import { findTracksByArtistSlug } from "./vip-artist-tracks";

export type PackRoot = "vip" | "colecoes";

export type PackResolvedFolder = {
  slug: string;
  slugSegments: string[];
  folderId: string;
  folderName: string;
  displayName: string;
  relativePath: string;
  pathLabels: string[];
  root: PackRoot;
};

export type PackTrackJob = {
  fileId: string;
  fileName: string;
  relativePath: string;
  title: string;
};

export { parsePackDownloadInput };

export async function resolvePackFolderBySlug(
  slug: string,
  options?: { root?: PackRoot },
): Promise<PackResolvedFolder | null> {
  const rootMode: PackRoot = options?.root === "colecoes" ? "colecoes" : "vip";
  const rootId =
    rootMode === "colecoes" ? await getCollectionsRootFolderId() : getVipMusicRootFolderId();
  if (!rootId) return null;

  const segments = slug
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;

  let parentId: string | undefined = rootId;
  const resolved: VipMusicFolder[] = [];

  for (const segment of segments) {
    const folders = await listVipMusicFolders(parentId);
    const match = findFolderBySlug(folders, segment);
    if (!match) return null;
    resolved.push(match);
    parentId = match.id;
  }

  const target = resolved.at(-1);
  if (!target) return null;

  const pathLabels = resolved.map((folder) => displayFolderName(folder.name));
  const relativePath =
    rootMode === "colecoes"
      ? withForcedFolderTree(pathLabels.join("/"))
      : pathLabels.join("/");
  return {
    slug: segments.join("/"),
    slugSegments: segments,
    folderId: target.id,
    folderName: target.name,
    displayName: displayFolderName(target.name),
    relativePath,
    pathLabels,
    root: rootMode,
  };
}

async function collectTracksRecursive(
  folderId: string,
  folderName: string,
  relativePath: string,
  depth = 0,
): Promise<PackTrackJob[]> {
  if (depth > 8) return [];

  const catalog = await getVipMusicCatalog(folderId, folderName);
  const toJob = (track: PreviewTrack): PackTrackJob | null => {
    const rawName = track.fileName ?? track.title;
    // Capas `folder.*` não devem ir para a fila.
    if (/^folder(\.|$)/i.test(rawName.trim())) return null;
    const fileName = ensureAudioExtension(rawName);
    return {
      fileId: track.id,
      fileName,
      // Diretório apenas — o Downloader junta fileName no destino.
      relativePath,
      title: track.title,
    };
  };

  if (catalog.level === "tracks") {
    return catalog.tracks.map(toJob).filter((job): job is PackTrackJob => Boolean(job));
  }

  const jobs: PackTrackJob[] = catalog.tracks
    .map(toJob)
    .filter((job): job is PackTrackJob => Boolean(job));

  const nestedBatches = await mapPool(catalog.items, 8, async (item) => {
    const childPath = relativePath
      ? `${relativePath}/${displayFolderName(item.name)}`
      : displayFolderName(item.name);
    return collectTracksRecursive(item.id, item.name, childPath, depth + 1);
  });
  for (const nested of nestedBatches) {
    jobs.push(...nested);
  }
  return jobs;
}

/**
 * Validação rápida: confirma que a pasta existe sem varrer milhares de MP3
 * (mês inteiro pode passar de 30s e estourar o timeout do app desktop).
 */
export async function previewPackBySlug(slug: string, options?: { root?: PackRoot }) {
  const folder = await resolvePackFolderBySlug(slug, options);
  if (!folder) {
    return { error: "Pasta não encontrada. Confira o link copiado no site." as const };
  }

  const catalog = await getVipMusicCatalog(folder.folderId, folder.folderName);
  if (catalog.level === "tracks") {
    const tracks = catalog.tracks.filter((track) => {
      const rawName = track.fileName ?? track.title;
      return !/^folder(\.|$)/i.test(rawName.trim());
    });
    return {
      ok: true as const,
      folder,
      trackCount: tracks.length,
      sampleTitles: tracks.slice(0, 8).map((track) => track.title),
      hasSubfolders: false,
      trackCountIsEstimate: false,
    };
  }

  const subfolderCount = catalog.items.length;
  return {
    ok: true as const,
    folder,
    // Contagem real só no import — aqui só confirmamos a pasta.
    trackCount: catalog.tracks.length,
    sampleTitles: catalog.items.slice(0, 8).map((item) => displayFolderName(item.name)),
    hasSubfolders: subfolderCount > 0,
    trackCountIsEstimate: true,
    subfolderCount,
  };
}

export async function importPackJobsBySlug(
  portalUserId: number,
  slug: string,
  options?: { targetDeviceId?: string | null; root?: PackRoot },
) {
  const folder = await resolvePackFolderBySlug(slug, { root: options?.root });
  if (!folder) {
    return { error: "Pasta não encontrada. Confira o link copiado no site." as const };
  }

  const tracks = await collectTracksRecursive(folder.folderId, folder.folderName, folder.relativePath);
  if (tracks.length === 0) {
    return { error: "Esta pasta não possui faixas para baixar." as const };
  }

  const targetDeviceId = options?.targetDeviceId?.trim() || null;
  const inputs: DownloadJobInput[] = tracks.map((track) => ({
    fileId: track.fileId,
    fileName: track.fileName,
    relativePath: track.relativePath,
    provider: "GOOGLE_DRIVE",
    ...(targetDeviceId ? { targetDeviceId } : {}),
  }));

  // Pack: cota especial (STARTER = 1 pack/janela, mesmo se >1000 faixas).
  const jobs = await createDownloadJobsBatch(portalUserId, inputs, { quotaMode: "pack" });
  return {
    ok: true as const,
    folder,
    trackCount: tracks.length,
    count: jobs.length,
    jobs,
  };
}

/** Prévia de perfil de artista (`/musicas/artistas/[slug]`). */
export async function previewArtistBySlug(slug: string) {
  const profile = await findTracksByArtistSlug(slug);
  if (!profile.slug) {
    return { error: "Artista inválido." as const };
  }
  if (profile.trackCount === 0) {
    return {
      ok: true as const,
      kind: "artist" as const,
      folder: {
        slug: profile.slug,
        displayName: profile.name,
        relativePath: `Artistas/${profile.name}`,
        pathLabels: ["Artistas", profile.name],
        root: "vip" as const,
        folderId: `artist:${profile.slug}`,
        folderName: profile.name,
        slugSegments: [profile.slug],
      },
      trackCount: 0,
      sampleTitles: [] as string[],
      hasSubfolders: false,
      trackCountIsEstimate: false,
    };
  }

  return {
    ok: true as const,
    kind: "artist" as const,
    folder: {
      slug: profile.slug,
      displayName: profile.name,
      relativePath: `Artistas/${profile.name}`,
      pathLabels: ["Artistas", profile.name],
      root: "vip" as const,
      folderId: `artist:${profile.slug}`,
      folderName: profile.name,
      slugSegments: [profile.slug],
    },
    trackCount: profile.trackCount,
    sampleTitles: profile.tracks.slice(0, 8).map((track) => track.title),
    hasSubfolders: false,
    trackCountIsEstimate: false,
  };
}

/** Enfileira faixas do artista no Downloader. */
export async function importArtistJobsBySlug(
  portalUserId: number,
  slug: string,
  options?: { targetDeviceId?: string | null },
) {
  const profile = await findTracksByArtistSlug(slug);
  if (!profile.slug) {
    return { error: "Artista inválido." as const };
  }
  if (profile.tracks.length === 0) {
    return { error: "Nenhuma faixa encontrada para este artista." as const };
  }

  const artistFolder = `Artistas/${profile.name}`;
  const targetDeviceId = options?.targetDeviceId?.trim() || null;
  const inputs: DownloadJobInput[] = profile.tracks.map((track) => {
    const rawName = track.fileName ?? track.title;
    const fileName = ensureAudioExtension(rawName);
    const relativePath = track.relativePath?.trim()
      ? `${artistFolder}/${track.relativePath}`
      : artistFolder;
    return {
      fileId: track.id,
      fileName,
      relativePath,
      provider: "GOOGLE_DRIVE" as const,
      ...(targetDeviceId ? { targetDeviceId } : {}),
    };
  });

  const jobs = await createDownloadJobsBatch(portalUserId, inputs, { quotaMode: "pack" });
  return {
    ok: true as const,
    kind: "artist" as const,
    folder: {
      slug: profile.slug,
      displayName: profile.name,
      relativePath: artistFolder,
      pathLabels: ["Artistas", profile.name],
      root: "vip" as const,
      folderId: `artist:${profile.slug}`,
      folderName: profile.name,
      slugSegments: [profile.slug],
    },
    trackCount: profile.tracks.length,
    count: jobs.length,
    jobs,
  };
}
