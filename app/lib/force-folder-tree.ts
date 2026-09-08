/** Prefixo em relativePath: o Downloader sempre cria subpastas (ignora a preferência). */
export const FORCE_FOLDER_TREE_PREFIX = "__BRS_TREE__/";

export function withForcedFolderTree(relativePath: string): string {
  const cleaned = relativePath.replace(/^\/+|\/+$/g, "").trim();
  if (!cleaned) return FORCE_FOLDER_TREE_PREFIX.replace(/\/$/, "");
  if (cleaned.startsWith(FORCE_FOLDER_TREE_PREFIX)) return cleaned;
  return `${FORCE_FOLDER_TREE_PREFIX}${cleaned}`;
}

export function stripForcedFolderTreePrefix(relativePath: string | null | undefined): string {
  if (!relativePath?.trim()) return "";
  const trimmed = relativePath.trim();
  if (trimmed.startsWith(FORCE_FOLDER_TREE_PREFIX)) {
    return trimmed.slice(FORCE_FOLDER_TREE_PREFIX.length);
  }
  return trimmed;
}

export function hasForcedFolderTree(relativePath: string | null | undefined): boolean {
  return Boolean(relativePath?.startsWith(FORCE_FOLDER_TREE_PREFIX));
}
