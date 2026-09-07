import type { VipMusicFolder } from "./vip-music-catalog";

export type MonthStatus = "completo" | "em-atualizacao" | "em-breve" | "none";

const MONTH_INDEX: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

export function slugifyFolderName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[[\]]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function folderHref(slugSegments: string[]): string {
  if (slugSegments.length === 0) return "/musicas/atualizacoes";
  return `/musicas/atualizacoes/${slugSegments.join("/")}`;
}

export function collectionsHref(slugSegments: string[] = []): string {
  if (slugSegments.length === 0) return "/musicas/colecoes";
  return `/musicas/colecoes/${slugSegments.map(encodeURIComponent).join("/")}`;
}

export function findFolderBySlug(folders: VipMusicFolder[], slug: string): VipMusicFolder | null {
  const normalized = slug.toLowerCase();
  return folders.find((folder) => slugifyFolderName(folder.name) === normalized) ?? null;
}

export function parseMonthStatus(name: string): { label: string; status: MonthStatus } {
  const completo = /\[COMPLETO\]/i.test(name);
  const emAtualizacao = /\[EM ATUALIZAÇÃO\]/i.test(name) || /\[EM ATUALIZACAO\]/i.test(name);
  const emBreve = /\[EM BREVE\]/i.test(name);

  if (completo) return { label: "Completo", status: "completo" };
  if (emAtualizacao) return { label: "Em atualização", status: "em-atualizacao" };
  if (emBreve) return { label: "Em breve", status: "em-breve" };
  return { label: "", status: "none" };
}

export function displayFolderName(name: string): string {
  return name.replace(/\s*\[[^\]]+\]\s*/gi, " ").trim();
}

/** Detecta pastas "SEMANA 01", "Semana 1", etc. */
export function isWeekFolderName(name: string): boolean {
  return /\bsemana\s*0*\d+/i.test(displayFolderName(name));
}

export function parseWeekNumber(name: string): number | null {
  const match = displayFolderName(name).match(/\bsemana\s*0*(\d+)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Pastas de ano: "BRS 2026", "BRS 2025". */
export function isYearFolderName(name: string): boolean {
  return /^brs\s+\d{4}\b/i.test(displayFolderName(name).trim());
}

export function parseYearFolder(name: string): number | null {
  const match = displayFolderName(name).trim().match(/^brs\s+(\d{4})\b/i);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

/**
 * Pastas de data: "DATA 07/09/2026", "DATA 07-09-2026", "07/09/2026".
 * Retorna componentes numéricos (day, month, year).
 */
export function parseDateFolder(name: string): { day: number; month: number; year: number } | null {
  const label = displayFolderName(name).trim();
  const match = label.match(/^(?:data\s+)?(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/i);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return { day, month, year };
}

export function isDateFolderName(name: string): boolean {
  return parseDateFolder(name) != null;
}

/** Label amigável: 07/09/2026 */
export function formatDateFolderLabel(name: string): string {
  const parsed = parseDateFolder(name);
  if (!parsed) return displayFolderName(name);
  const dd = String(parsed.day).padStart(2, "0");
  const mm = String(parsed.month).padStart(2, "0");
  return `${dd}/${mm}/${parsed.year}`;
}

export function childrenAreYearFolders(folders: VipMusicFolder[]): boolean {
  if (folders.length === 0) return false;
  const years = folders.filter((folder) => isYearFolderName(folder.name)).length;
  return years >= Math.max(1, Math.ceil(folders.length * 0.5));
}

export function childrenAreDateFolders(folders: VipMusicFolder[]): boolean {
  if (folders.length === 0) return false;
  const dates = folders.filter((folder) => isDateFolderName(folder.name)).length;
  return dates >= Math.max(1, Math.ceil(folders.length * 0.5));
}

export function sortFoldersByDateFolder(folders: VipMusicFolder[], newestFirst = true): VipMusicFolder[] {
  const dir = newestFirst ? -1 : 1;
  return [...folders].sort((a, b) => {
    const da = parseDateFolder(a.name);
    const db = parseDateFolder(b.name);
    if (da && db) {
      if (da.year !== db.year) return (da.year - db.year) * dir;
      if (da.month !== db.month) return (da.month - db.month) * dir;
      if (da.day !== db.day) return (da.day - db.day) * dir;
    }
    if (da && !db) return -1;
    if (!da && db) return 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true }) * (newestFirst ? -1 : 1);
  });
}

export function sortFoldersByYear(folders: VipMusicFolder[], newestFirst = true): VipMusicFolder[] {
  const dir = newestFirst ? -1 : 1;
  return [...folders].sort((a, b) => {
    const ya = parseYearFolder(a.name);
    const yb = parseYearFolder(b.name);
    if (ya != null && yb != null && ya !== yb) return (ya - yb) * dir;
    if (ya != null && yb == null) return -1;
    if (ya == null && yb != null) return 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true }) * (newestFirst ? -1 : 1);
  });
}

export function parseMonthFolderDate(name: string): { year: number; month: number } | null {
  const label = displayFolderName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  const match = label.match(
    /^(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(\d{4})$/i,
  );
  if (!match) return null;
  const monthKey = match[1].toLowerCase();
  const month = MONTH_INDEX[monthKey];
  const year = Number(match[2]);
  if (!month || !Number.isFinite(year)) return null;
  return { year, month };
}

/** Maioria dos filhos parece semana → hierarquia Mês > Semana > Estilo. */
export function childrenAreWeekFolders(folders: VipMusicFolder[]): boolean {
  if (folders.length === 0) return false;
  const weeks = folders.filter((folder) => isWeekFolderName(folder.name)).length;
  return weeks >= Math.max(1, Math.ceil(folders.length * 0.5));
}

export function sortFoldersByWeek(folders: VipMusicFolder[]): VipMusicFolder[] {
  return [...folders].sort((a, b) => {
    const wa = parseWeekNumber(a.name);
    const wb = parseWeekNumber(b.name);
    if (wa != null && wb != null && wa !== wb) return wa - wb;
    if (wa != null && wb == null) return -1;
    if (wa == null && wb != null) return 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
  });
}

/** Meses mais recentes primeiro (JULHO 2024 antes de JUNHO 2024). */
export function sortFoldersByMonthDate(folders: VipMusicFolder[], newestFirst = true): VipMusicFolder[] {
  const dir = newestFirst ? -1 : 1;
  return [...folders].sort((a, b) => {
    const da = parseMonthFolderDate(a.name);
    const db = parseMonthFolderDate(b.name);
    if (da && db) {
      if (da.year !== db.year) return (da.year - db.year) * dir;
      if (da.month !== db.month) return (da.month - db.month) * dir;
    }
    if (da && !db) return -1;
    if (!da && db) return 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true }) * (newestFirst ? -1 : 1);
  });
}

export function sortVipChildFolders(folders: VipMusicFolder[]): VipMusicFolder[] {
  if (childrenAreDateFolders(folders)) return sortFoldersByDateFolder(folders, true);
  if (childrenAreYearFolders(folders)) return sortFoldersByYear(folders, true);
  if (childrenAreWeekFolders(folders)) return sortFoldersByWeek(folders);
  const monthLike = folders.filter((folder) => parseMonthFolderDate(folder.name)).length;
  if (monthLike >= Math.ceil(folders.length * 0.5)) {
    return sortFoldersByMonthDate(folders, true);
  }
  return [...folders].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
}
