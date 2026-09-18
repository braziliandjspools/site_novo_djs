import { listDriveFolderChildren } from "./google-drive";
import { displayFolderName, slugifyFolderName } from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|m4a|aac|ogg)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp)$/i;

export type FolderCoverRef = {
  fileId: string;
  fileName: string;
  /** URL relativa no site para o proxy de capa. */
  coverUrl: string;
};

function baseNameWithoutExt(name: string) {
  const trimmed = name.trim();
  const idx = trimmed.lastIndexOf(".");
  if (idx <= 0) return trimmed;
  return trimmed.slice(0, idx).trim();
}

function isImageFile(file: { name: string; mimeType: string }) {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.test(file.name);
}

/** Arquivo de capa: nome "folder" (com ou sem extensão de imagem). */
export function isFolderCoverFile(file: { name: string; mimeType: string }) {
  if (!isImageFile(file)) return false;
  const base = baseNameWithoutExt(file.name);
  return /^folder$/i.test(base);
}

/** Imagem com o mesmo nome (slug) da pasta pai — capa da raiz. */
export function isNamedFolderCoverFile(
  file: { name: string; mimeType: string },
  folderName: string,
) {
  if (!isImageFile(file)) return false;
  const fileSlug = slugifyFolderName(baseNameWithoutExt(file.name));
  const folderSlug = slugifyFolderName(displayFolderName(folderName));
  return Boolean(fileSlug && folderSlug && fileSlug === folderSlug);
}

export function isDriveAudioFile(file: { name: string; mimeType: string }) {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.test(file.name);
}

export function folderCoverUrl(fileId: string) {
  return `/api/musicas/cover/${encodeURIComponent(fileId)}`;
}

/**
 * Procura capa na pasta:
 * 1) imagem com o mesmo nome da pasta
 * 2) `folder.jpg` / `folder.png` / etc.
 */
export function pickCoverFromChildren(
  children: Array<{ id: string; name: string; mimeType: string }>,
  folderName?: string,
): FolderCoverRef | null {
  const named =
    folderName?.trim()
      ? children.find((file) => isNamedFolderCoverFile(file, folderName))
      : undefined;
  const cover = named ?? children.find((file) => isFolderCoverFile(file));
  if (!cover) return null;
  return {
    fileId: cover.id,
    fileName: cover.name,
    coverUrl: folderCoverUrl(cover.id),
  };
}

export async function findFolderCover(
  folderId: string,
  folderName?: string,
): Promise<FolderCoverRef | null> {
  try {
    const children = await listDriveFolderChildren(folderId);
    return pickCoverFromChildren(children, folderName);
  } catch {
    return null;
  }
}
