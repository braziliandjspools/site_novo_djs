import {
  displayFolderName,
  findFolderBySlug,
  formatUpdateDateLabel,
  parseUpdateDateFolder,
} from "./vip-music-slugs";
import { listDriveFolderChildren } from "./google-drive";
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

  const dates = await listPackDates(folder.folderId, folder.folderName);
  if (dates.length > 0) {
    return {
      ok: true as const,
      folder,
      trackCount: 0,
      sampleTitles: dates.slice(0, 8).map((date) => date.label),
      hasSubfolders: true,
      trackCountIsEstimate: true,
      subfolderCount: dates.length,
      dates,
    };
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
      dates: [] as PackDateOption[],
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
    dates,
  };
}

export async function importPackJobsBySlug(
  portalUserId: number,
  slug: string,
  options?: {
    targetDeviceId?: string | null;
    root?: PackRoot;
    offset?: number;
    limit?: number;
    targets?: { folderId: string; folderName: string; relativePath: string }[];
  },
) {
  const folder = await resolvePackFolderBySlug(slug, { root: options?.root });
  if (!folder) {
    return { error: "Pasta não encontrada. Confira o link copiado no site." as const };
  }

  // Segurança: acervo VIP de 1º nível não pode ser enfileirado inteiro.
  // Pastas internas (estilo, data, etc.) continuam permitidas.
  if (folder.root === "vip" && folder.slugSegments.length === 1) {
    return {
      error:
        "Não é permitido baixar o acervo inteiro. Abra um estilo ou uma pasta e envie essa pasta ao Downloader." as const,
    };
  }

  const selected = options?.targets?.filter((target) => target.folderId?.trim()) ?? [];
  const tracks = selected.length
    ? (
        await mapPool(selected, 4, (target) =>
          collectTracksRecursive(
            target.folderId,
            target.folderName,
            target.relativePath
              ? `${folder.relativePath}/${target.relativePath}`
              : folder.relativePath,
          ),
        )
      ).flat()
    : await collectTracksRecursive(folder.folderId, folder.folderName, folder.relativePath);
  if (tracks.length === 0) {
    return { error: "Esta pasta não possui faixas para baixar." as const };
  }

  const offset = Math.max(0, Math.floor(options?.offset ?? 0));
  const limit =
    options?.limit != null && Number.isFinite(options.limit)
      ? Math.max(1, Math.min(200, Math.floor(options.limit)))
      : tracks.length;
  const slice = tracks.slice(offset, offset + limit);
  if (slice.length === 0) {
    return {
      ok: true as const,
      folder,
      trackCount: tracks.length,
      count: 0,
      hasMore: false,
      nextOffset: offset,
      jobs: [],
    };
  }

  const targetDeviceId = options?.targetDeviceId?.trim() || null;
  const inputs: DownloadJobInput[] = slice.map((track) => ({
    fileId: track.fileId,
    fileName: track.fileName,
    relativePath: track.relativePath,
    provider: "GOOGLE_DRIVE",
    ...(targetDeviceId ? { targetDeviceId } : {}),
  }));

  const jobs = await createDownloadJobsBatch(portalUserId, inputs);
  const nextOffset = offset + slice.length;
  return {
    ok: true as const,
    folder,
    trackCount: tracks.length,
    count: jobs.length,
    hasMore: nextOffset < tracks.length,
    nextOffset,
    jobs,
  };
}

export type PackDateOption = {
  key: string;
  label: string;
  folderId: string;
  name: string;
};

export type PackStyleOption = {
  folderId: string;
  name: string;
};

export type PackPoolOption = {
  folderId: string;
  name: string;
  styles: PackStyleOption[];
};

export type PackDayContents = {
  pools: PackPoolOption[];
  styles: PackStyleOption[];
};

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

export async function listPackDates(folderId: string, folderName: string): Promise<PackDateOption[]> {
  const own = parseUpdateDateFolder(folderName);
  if (own) {
    return [{ key: own.key, label: own.label, folderId, name: folderName }];
  }

  const children = await listDriveFolderChildren(folderId);
  return children
    .filter((child) => child.mimeType === DRIVE_FOLDER_MIME && parseUpdateDateFolder(child.name))
    .map((child) => {
      const parsed = parseUpdateDateFolder(child.name)!;
      return { key: parsed.key, label: parsed.label || formatUpdateDateLabel(parsed.key), folderId: child.id, name: child.name };
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}

export async function listPackDayContents(dateFolderId: string): Promise<PackDayContents> {
  const children = await listDriveFolderChildren(dateFolderId);
  const folders = children.filter((child) => child.mimeType === DRIVE_FOLDER_MIME);
  const pools: PackPoolOption[] = [];
  const styles: PackStyleOption[] = [];

  const details = await mapPool(folders, 6, async (folder) => {
    const nested = await listDriveFolderChildren(folder.id);
    const subfolders = nested.filter((child) => child.mimeType === DRIVE_FOLDER_MIME);
    if (subfolders.length > 0) {
      pools.push({
        folderId: folder.id,
        name: displayFolderName(folder.name),
        styles: subfolders
          .map((style) => ({ folderId: style.id, name: displayFolderName(style.name) }))
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      });
      return;
    }
    styles.push({ folderId: folder.id, name: displayFolderName(folder.name) });
  });
  void details;

  pools.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  styles.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { pools, styles };
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
  options?: { targetDeviceId?: string | null; offset?: number; limit?: number },
) {
  const profile = await findTracksByArtistSlug(slug);
  if (!profile.slug) {
    return { error: "Artista inválido." as const };
  }
  if (profile.tracks.length === 0) {
    return { error: "Nenhuma faixa encontrada para este artista." as const };
  }

  const offset = Math.max(0, Math.floor(options?.offset ?? 0));
  const limit =
    options?.limit != null && Number.isFinite(options.limit)
      ? Math.max(1, Math.min(200, Math.floor(options.limit)))
      : profile.tracks.length;
  const slice = profile.tracks.slice(offset, offset + limit);
  const artistFolder = `Artistas/${profile.name}`;
  const targetDeviceId = options?.targetDeviceId?.trim() || null;
  const inputs: DownloadJobInput[] = slice.map((track) => {
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

  const jobs = inputs.length > 0 ? await createDownloadJobsBatch(portalUserId, inputs) : [];
  const nextOffset = offset + slice.length;
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
    hasMore: nextOffset < profile.tracks.length,
    nextOffset,
    jobs,
  };
}
