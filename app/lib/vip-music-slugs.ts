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
  if (childrenAreWeekFolders(folders)) return sortFoldersByWeek(folders);
  const monthLike = folders.filter((folder) => parseMonthFolderDate(folder.name)).length;
  if (monthLike >= Math.ceil(folders.length * 0.5)) {
    return sortFoldersByMonthDate(folders, true);
  }
  return [...folders].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }));
}
