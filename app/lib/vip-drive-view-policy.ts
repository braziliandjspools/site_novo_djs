export type DriveMetadata = { id: string; name: string; mimeType: string; parents?: string[]; trashed?: boolean };

export function isGmailAccount(email: string | null | undefined) {
  return /@gmail\.com$/i.test(email?.trim() ?? "");
}

/** Link sem credenciais. O servidor só deve entregá-lo após validar conta e arquivo. */
export function googleDriveFileLink(fileId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) throw new Error("ID do Drive inválido.");
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export async function verifyVipDriveFile(
  fileId: string,
  rootId: string,
  readMetadata: (id: string) => Promise<DriveMetadata | null>,
): Promise<string | null> {
  const file = await readMetadata(fileId);
  if (!file || file.trashed || !(file.mimeType.startsWith("audio/") || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file.name))) return null;
  let parents = file.parents ?? [];
  const seen = new Set<string>([fileId]);
  for (let depth = 0; depth < 16 && parents.length; depth++) {
    if (parents.includes(rootId)) return file.name;
    const next = parents.find((id) => !seen.has(id) && /^[a-zA-Z0-9_-]+$/.test(id));
    if (!next) break;
    seen.add(next);
    const folder = await readMetadata(next);
    if (!folder || folder.trashed || folder.mimeType !== "application/vnd.google-apps.folder") break;
    parents = folder.parents ?? [];
  }
  return null;
}
