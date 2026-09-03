const MONTHS_KEY = "brs-vip-seen-months";
const STYLES_KEY_PREFIX = "brs-vip-seen-styles:";

function readIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(ids));
}

export function monthsReadKey() {
  return MONTHS_KEY;
}

export function stylesReadKey(monthSlug: string) {
  return `${STYLES_KEY_PREFIX}${monthSlug}`;
}

export function weeksReadKey(monthSlug: string) {
  return `${STYLES_KEY_PREFIX}weeks:${monthSlug}`;
}

/** Pastas que não estavam na última visita (primeira visita não destaca nada). */
export function getNewFolderIds(storageKey: string, currentIds: string[]): Set<string> {
  const seen = readIds(storageKey);
  if (seen.length === 0 || currentIds.length === 0) return new Set();
  const seenSet = new Set(seen);
  return new Set(currentIds.filter((id) => !seenSet.has(id)));
}

export function markFoldersRead(storageKey: string, currentIds: string[]): void {
  if (currentIds.length === 0) return;
  writeIds(storageKey, currentIds);
}
