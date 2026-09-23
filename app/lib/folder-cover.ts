import { listDriveFolderChildren } from "./google-drive";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|m4a|aac|ogg)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp)$/i;

export type FolderCoverRef = {
  fileId: string;
  fileName: string;
  /** URL relativa no site para o proxy de capa. */
  coverUrl: string;
};

function isImageFile(file: { name: string; mimeType: string }) {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.test(file.name);
}

/** Arquivo oficial de capa: somente folder.png na raiz da pasta. */
export function isFolderCoverFile(file: { name: string; mimeType: string }) {
  if (!isImageFile(file)) return false;
  return file.name.trim().toLowerCase() === "folder.png";
}

export function isDriveAudioFile(file: { name: string; mimeType: string }) {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.test(file.name);
}

export function folderCoverUrl(fileId: string) {
  return `/api/musicas/cover/${encodeURIComponent(fileId)}`;
}

/** Procura folder.png diretamente entre os filhos da pasta. */
export function pickCoverFromChildren(
  children: Array<{ id: string; name: string; mimeType: string }>,
  _folderName?: string,
): FolderCoverRef | null {
  const cover = children.find((file) => isFolderCoverFile(file));
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
