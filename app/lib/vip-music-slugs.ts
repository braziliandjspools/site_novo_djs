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
  // Usa o nome “limpo” (sem [COMPLETO]/[EM ATUALIZAÇÃO]/…) para o slug bater com a URL.
  let slug = displayFolderName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // SEMANA 2 e SEMANA 02 → semana-02 (mesmo path no site e no Downloader).
  const weekPad = slug.match(/^semana-(\d+)$/);
  if (weekPad) {
    slug = `semana-${weekPad[1].padStart(2, "0")}`;
  }
  return slug;
}

/** Slug de pasta de estilo (Funk, Sertanejo…) — mesmo algoritmo, uso explícito na URL/Downloader. */
export function slugifyStyleName(name: string): string {
  return slugifyFolderName(name);
}

export function folderHref(slugSegments: string[]): string {
  if (slugSegments.length === 0) return "/musicas/atualizacoes";
  return `/musicas/atualizacoes/${slugSegments.join("/")}`;
}

export function collectionsHref(slugSegments: string[] = []): string {
  if (slugSegments.length === 0) return "/musicas/colecoes";
  return `/musicas/colecoes/${slugSegments.map(encodeURIComponent).join("/")}`;
}

/** Slug de artista (mesmo algoritmo das pastas). */
export function slugifyArtistName(name: string): string {
  return slugifyFolderName(name);
}

export function artistsHref(slug?: string | null): string {
  const clean = slug?.trim();
  if (!clean) return "/musicas/artistas";
  return `/musicas/artistas/${encodeURIComponent(slugifyArtistName(clean))}`;
}

export function stylesHref(slug?: string | null): string {
  const clean = slug?.trim();
  if (!clean) return "/musicas/estilos";
  return `/musicas/estilos/${encodeURIComponent(slugifyStyleName(clean))}`;
}

function parseWeekNumberFromSlug(slug: string): number | null {
  const match = slug.match(/^semana-0*(\d+)$/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function parseMonthFromSlug(slug: string): { month: number; year: number | null } | null {
  const parts = slug.toLowerCase().split("-").filter(Boolean);
  if (parts.length === 0) return null;

  let index = 0;
  let leadingMonthNum: number | null = null;
  if (/^(0?[1-9]|1[0-2])$/.test(parts[0])) {
    leadingMonthNum = Number(parts[0]);
    index = 1;
  }

  for (let i = index; i < parts.length; i++) {
    const month = MONTH_INDEX[parts[i]];
    if (!month) continue;
    const yearPart = parts[i + 1];
    if (yearPart && /^\d{4}$/.test(yearPart)) {
      return { month, year: Number(yearPart) };
    }
    return { month, year: null };
  }

  // Slug só numérico: "04" ou "04-2024".
  if (leadingMonthNum != null) {
    const yearPart = parts[1];
    if (yearPart && /^\d{4}$/.test(yearPart)) {
      return { month: leadingMonthNum, year: Number(yearPart) };
    }
    return { month: leadingMonthNum, year: null };
  }

  return null;
}

function folderHasExplicitYear(name: string): boolean {
  return /\b(19|20)\d{2}\b/.test(displayFolderName(name));
}

/**
 * Resolve pasta pelo segmento de URL, tolerando diferenças comuns do Drive:
 * status no nome, SEMANA 2 vs semana-02, JANEIRO vs 04- ABRIL 2024 vs janeiro-2024.
 */
export function findFolderBySlug(folders: VipMusicFolder[], slug: string): VipMusicFolder | null {
  const normalized = slug.toLowerCase().trim();
  if (!normalized || folders.length === 0) return null;

  const exact = folders.find((folder) => slugifyFolderName(folder.name) === normalized);
  if (exact) return exact;

  const weekNum = parseWeekNumberFromSlug(normalized);
  if (weekNum != null) {
    const weekMatch = folders.find((folder) => parseWeekNumber(folder.name) === weekNum);
    if (weekMatch) return weekMatch;
  }

  const monthFromSlug = parseMonthFromSlug(normalized);
  if (monthFromSlug) {
    const monthMatches = folders.filter((folder) => {
      const parsed = parseMonthFolderDate(folder.name);
      if (!parsed || parsed.month !== monthFromSlug.month) return false;
      if (monthFromSlug.year == null) return true;
      if (folderHasExplicitYear(folder.name)) return parsed.year === monthFromSlug.year;
      // Pasta só com mês (“JANEIRO”) aceita slug com ano (janeiro-2024).
      return true;
    });
    if (monthMatches.length === 1) return monthMatches[0];
    if (monthMatches.length > 1 && monthFromSlug.year != null) {
      const byYear = monthMatches.find((folder) => {
        const parsed = parseMonthFolderDate(folder.name);
        return parsed?.year === monthFromSlug.year;
      });
      if (byYear) return byYear;
    }
    if (monthMatches.length > 0) return monthMatches[0];
  }

  // Fallback só para sufixos de status legados no slug (…-em-atualizacao).
  const soft = folders.find((folder) => {
    const folderSlug = slugifyFolderName(folder.name);
    if (folderSlug === normalized) return true;
    if (normalized.startsWith(`${folderSlug}-`)) {
      const rest = normalized.slice(folderSlug.length + 1);
      return /^(em-atualizacao|em-breve|completo)(-|$)/i.test(rest);
    }
    if (folderSlug.startsWith(`${normalized}-`)) {
      const rest = folderSlug.slice(normalized.length + 1);
      return /^(em-atualizacao|em-breve|completo)(-|$)/i.test(rest);
    }
    return false;
  });
  return soft ?? null;
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
  return name
    .replace(/\s*\[[^\]]+\]\s*/gi, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

/**
 * Pastas de atualização no Drive: `17-09-2026`, `17.09.2026`, `17/09/2026`.
 * Não confunde com meses tipo `04- ABRIL 2024`.
 */
export function parseUpdateDateFolder(
  name: string,
): { day: number; month: number; year: number; key: string; label: string } | null {
  const label = displayFolderName(name).trim();
  const match = label.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > lastDay) return null;
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const display = `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
  return { day, month, year, key, label: display };
}

export function isUpdateDateFolderName(name: string): boolean {
  return parseUpdateDateFolder(name) != null;
}

export function formatUpdateDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
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

const MONTH_NAME_PATTERN =
  "janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";

export function parseMonthFolderDate(name: string): { year: number; month: number } | null {
  const label = displayFolderName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

  // "04- ABRIL 2024", "04 - Abril 2024", "04.ABRIL.2024", "04 ABRIL"
  const numbered = label.match(
    new RegExp(
      `^(0?[1-9]|1[0-2])\\s*[-._]?\\s*(${MONTH_NAME_PATTERN})(?:\\s*[-._]?\\s*(\\d{4}))?$`,
      "i",
    ),
  );
  if (numbered) {
    const monthFromName = MONTH_INDEX[numbered[2].toLowerCase()];
    if (!monthFromName) return null;
    const year = numbered[3] ? Number(numbered[3]) : new Date().getFullYear();
    if (!Number.isFinite(year)) return null;
    return { year, month: monthFromName };
  }

  const withYear = label.match(
    new RegExp(`^(${MONTH_NAME_PATTERN})\\s+(\\d{4})$`, "i"),
  );
  if (withYear) {
    const monthKey = withYear[1].toLowerCase();
    const month = MONTH_INDEX[monthKey];
    const year = Number(withYear[2]);
    if (!month || !Number.isFinite(year)) return null;
    return { year, month };
  }

  const monthOnly = label.match(new RegExp(`^(${MONTH_NAME_PATTERN})$`, "i"));
  if (!monthOnly) return null;
  const month = MONTH_INDEX[monthOnly[1].toLowerCase()];
  if (!month) return null;
  return { year: new Date().getFullYear(), month };
}

/** Detecta pastas de mês: "JANEIRO", "04- ABRIL 2024", "Janeiro 2024", etc. */
export function isMonthFolderName(name: string): boolean {
  return parseMonthFolderDate(name) != null;
}

/** Maioria dos filhos parece mês → hierarquia Pack > Mês > Pastas. */
export function childrenAreMonthFolders(folders: VipMusicFolder[]): boolean {
  if (folders.length === 0) return false;
  const months = folders.filter((folder) => isMonthFolderName(folder.name)).length;
  return months >= Math.max(1, Math.ceil(folders.length * 0.5));
}

/** Pastas de coleção anual: "PACKS 2026", "POOLS 2026", etc. */
export function parseYearCollectionFolder(name: string): { year: number; kind: string } | null {
  const label = displayFolderName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  const match = label.match(/^([a-z0-9][a-z0-9\s_-]*?)\s+(\d{4})$/i);
  if (!match) return null;
  const year = Number(match[2]);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) return null;
  // Evita colidir com "SETEMBRO 2026" (mês).
  if (MONTH_INDEX[match[1].toLowerCase().replace(/\s+/g, "")]) return null;
  if (parseMonthFolderDate(name)) return null;
  return { year, kind: match[1].trim().toUpperCase() };
}

export function sortFoldersByYearCollection<T extends VipMusicFolder>(
  folders: T[],
  newestFirst = true,
): T[] {
  const dir = newestFirst ? -1 : 1;
  return [...folders].sort((a, b) => {
    const da = parseYearCollectionFolder(a.name);
    const db = parseYearCollectionFolder(b.name);
    if (da && db) {
      if (da.year !== db.year) return (da.year - db.year) * dir;
      return da.kind.localeCompare(db.kind, "pt-BR");
    }
    if (da && !db) return -1;
    if (!da && db) return 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true }) * (newestFirst ? -1 : 1);
  });
}

/** Maioria dos filhos parece semana → hierarquia Mês > Semana > Estilo. */
export function childrenAreWeekFolders(folders: VipMusicFolder[]): boolean {
  if (folders.length === 0) return false;
  const weeks = folders.filter((folder) => isWeekFolderName(folder.name)).length;
  return weeks >= Math.max(1, Math.ceil(folders.length * 0.5));
}

export function sortFoldersByWeek<T extends VipMusicFolder>(folders: T[]): T[] {
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
export function sortFoldersByMonthDate<T extends VipMusicFolder>(
  folders: T[],
  newestFirst = true,
): T[] {
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

export function sortVipChildFolders<T extends VipMusicFolder>(folders: T[]): T[] {
  if (childrenAreWeekFolders(folders)) return sortFoldersByWeek(folders);
  const monthLike = folders.filter((folder) => parseMonthFolderDate(folder.name)).length;
  if (monthLike >= Math.ceil(folders.length * 0.5)) {
    return sortFoldersByMonthDate(folders, true);
  }
  const yearLike = folders.filter((folder) => parseYearCollectionFolder(folder.name)).length;
  if (yearLike >= Math.ceil(folders.length * 0.5)) {
    return sortFoldersByYearCollection(folders, true);
  }
  return [...folders].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
}
