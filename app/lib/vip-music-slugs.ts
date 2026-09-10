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

export type ParsedDayFolder = {
  day: number;
  month?: number;
  year?: number;
};

const MONTH_TOKEN_INDEX: Record<string, number> = {
  ...MONTH_INDEX,
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

/**
 * Detecta pastas de dia: "DIA 10", "10", "10-09-2026", "2026-09-10", "10 SET".
 * Usado na hierarquia Mês > Dia > Pool (ex.: SETEMBRO > DIA 10 > FUNK).
 */
export function parseDayFolder(name: string): ParsedDayFolder | null {
  const label = displayFolderName(name)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  if (!label || isWeekFolderName(name)) return null;

  let match = label.match(/^dia\s*0*(\d{1,2})\b/i);
  if (match) {
    const day = Number(match[1]);
    if (day >= 1 && day <= 31) return { day };
  }

  match = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { day, month, year };
  }

  match = label.match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = match[3] ? Number(match[3]) : undefined;
    if (year != null && year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return { day, month, year };
  }

  match = label.match(
    /^(\d{1,2})\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b(?:\s+(\d{4}))?/i,
  );
  if (match) {
    const day = Number(match[1]);
    const month = MONTH_TOKEN_INDEX[match[2].toLowerCase()];
    const year = match[3] ? Number(match[3]) : undefined;
    if (day >= 1 && day <= 31 && month) return { day, month, year };
  }

  match = label.match(/^0*(\d{1,2})$/);
  if (match) {
    const day = Number(match[1]);
    if (day >= 1 && day <= 31) return { day };
  }

  return null;
}

export function isDayFolderName(name: string): boolean {
  return parseDayFolder(name) != null;
}

/** Chave ISO YYYY-MM-DD para agrupar/ordenar pastas de dia. */
export function dayFolderIsoKey(
  name: string,
  monthHint?: { year: number; month: number } | null,
): string | null {
  const parsed = parseDayFolder(name);
  if (!parsed) return null;
  const year = parsed.year ?? monthHint?.year;
  const month = parsed.month ?? monthHint?.month;
  if (!year || !month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
}

export function formatDayFolderHeading(
  name: string,
  monthHint?: { year: number; month: number } | null,
): string {
  const iso = dayFolderIsoKey(name, monthHint);
  if (iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return displayFolderName(name);
}

/** Maioria dos filhos parece dia → hierarquia Mês > Dia > Pool/estilo. */
export function childrenAreDayFolders(folders: VipMusicFolder[]): boolean {
  if (folders.length === 0) return false;
  if (childrenAreWeekFolders(folders)) return false;
  const days = folders.filter((folder) => isDayFolderName(folder.name)).length;
  return days >= Math.max(1, Math.ceil(folders.length * 0.5));
}

export function sortFoldersByDay(
  folders: VipMusicFolder[],
  monthHint?: { year: number; month: number } | null,
  newestFirst = true,
): VipMusicFolder[] {
  const dir = newestFirst ? -1 : 1;
  return [...folders].sort((a, b) => {
    const ka = dayFolderIsoKey(a.name, monthHint);
    const kb = dayFolderIsoKey(b.name, monthHint);
    if (ka && kb && ka !== kb) return ka.localeCompare(kb) * dir;
    const pa = parseDayFolder(a.name);
    const pb = parseDayFolder(b.name);
    if (pa && pb && pa.day !== pb.day) return (pa.day - pb.day) * dir;
    if (pa && !pb) return -1;
    if (!pa && pb) return 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true }) * dir;
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

export function sortFoldersByYearCollection(
  folders: VipMusicFolder[],
  newestFirst = true,
): VipMusicFolder[] {
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
  if (childrenAreWeekFolders(folders)) return sortFoldersByWeek(folders);
  if (childrenAreDayFolders(folders)) return sortFoldersByDay(folders, null, true);
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
