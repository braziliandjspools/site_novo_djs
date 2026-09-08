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

  for (const item of catalog.items) {
    const childPath = relativePath
      ? `${relativePath}/${displayFolderName(item.name)}`
      : displayFolderName(item.name);
    const nested = await collectTracksRecursive(item.id, item.name, childPath, depth + 1);
    jobs.push(...nested);
  }
  return jobs;
}

export async function previewPackBySlug(slug: string, options?: { root?: PackRoot }) {
  const folder = await resolvePackFolderBySlug(slug, options);
  if (!folder) {
    return { error: "Pasta não encontrada. Confira o link copiado no site." as const };
  }

  const tracks = await collectTracksRecursive(folder.folderId, folder.folderName, folder.relativePath);
  return {
    ok: true as const,
    folder,
    trackCount: tracks.length,
    sampleTitles: tracks.slice(0, 8).map((track) => track.title),
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

  // createDownloadJobsBatch já parte em chunks no Prisma; evita limite HTTP de 500.
  const jobs = await createDownloadJobsBatch(portalUserId, inputs);
  return {
    ok: true as const,
    folder,
    trackCount: tracks.length,
    count: jobs.length,
    jobs,
  };
}
