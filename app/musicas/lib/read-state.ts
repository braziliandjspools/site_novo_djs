const MONTHS_KEY = "brs-vip-seen-months";
const STYLES_KEY_PREFIX = "brs-vip-seen-styles:";

/** id da pasta -> data (yyyy-mm-dd) em que foi vista pela 1ª vez. */
type SeenMap = Record<string, string>;

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function readSeenMap(key: string): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as SeenMap;
    }
    return {};
  } catch {
    return {};
  }
}

function writeSeenMap(key: string, map: SeenMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore */
  }
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

/**
 * Pastas atualizadas recentemente ficam em destaque ("Novo") até virar 00:00
 * do dia em que foram vistas pela 1ª vez — não somem ao simplesmente sair da tela.
 */
export function getNewFolderIds(storageKey: string, currentIds: string[]): Set<string> {
  if (currentIds.length === 0) return new Set();
  const map = readSeenMap(storageKey);
  const isFirstVisitEver = Object.keys(map).length === 0;
  const today = todayKey();
  const result = new Set<string>();
  let changed = false;

  for (const id of currentIds) {
    const seenDate = map[id];
    if (!seenDate) {
      // Primeira visita ao acervo: não destaca nada (evita "tudo novo" no 1º acesso).
      if (!isFirstVisitEver) result.add(id);
      map[id] = today;
      changed = true;
    } else if (seenDate === today) {
      result.add(id);
    }
  }

  if (changed) writeSeenMap(storageKey, map);
  return result;
}

/** @deprecated Destaque expira sozinho à meia-noite; nada a marcar ao sair da tela. */
export function markFoldersRead(_storageKey: string, _currentIds: string[]): void {
  /* no-op */
}
