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

function baseNameWithoutExt(name: string) {
  const trimmed = name.trim();
  const idx = trimmed.lastIndexOf(".");
  if (idx <= 0) return trimmed;
  return trimmed.slice(0, idx).trim();
}

/** Arquivo de capa: nome "folder" (com ou sem extensão de imagem). */
export function isFolderCoverFile(file: { name: string; mimeType: string }) {
  if (file.mimeType === FOLDER_MIME) return false;
  const base = baseNameWithoutExt(file.name);
  if (!/^folder$/i.test(base)) return false;
  if (file.mimeType.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.test(file.name);
}

export function isDriveAudioFile(file: { name: string; mimeType: string }) {
  if (file.mimeType === FOLDER_MIME) return false;
  if (file.mimeType.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.test(file.name);
}

export function folderCoverUrl(fileId: string) {
  return `/api/musicas/cover/${encodeURIComponent(fileId)}`;
}

/** Procura `folder.jpg` / `folder.png` / etc. na raiz da pasta. */
export async function findFolderCover(folderId: string): Promise<FolderCoverRef | null> {
  try {
    const children = await listDriveFolderChildren(folderId);
    const cover = children.find((file) => isFolderCoverFile(file));
    if (!cover) return null;
    return {
      fileId: cover.id,
      fileName: cover.name,
      coverUrl: folderCoverUrl(cover.id),
    };
  } catch {
    return null;
  }
}
