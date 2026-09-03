import type { DownloadJob } from "../api/jobs";

/**
 * Organização local a partir dos metadados que já chegam no job:
 * - relativePath (mês / semana / estilo / arquivo) — enviado pelo site no envio/import
 * - fileName (pool / tipo de edit quando presentes no nome)
 * - createdAt (agrupamento por data)
 *
 * Não inventa valores: só extrai o que existe no texto do job.
 */

export type JobOrgMeta = {
  month: string | null;
  week: string | null;
  /** Pasta de estilo no Drive (ex.: Funk) — segmento real do caminho. */
  genre: string | null;
  /** Mesmo valor do estilo quando a hierarquia do site usa pastas de estilo. */
  category: string | null;
  /** Diretório do relativePath (sem o arquivo). */
  folder: string | null;
  /** Detectado no fileName/path somente se o token existir. */
  pool: string | null;
  /** Conteúdo entre parênteses no fileName quando parece tipo de edit. */
  editType: string | null;
  /** YYYY-MM-DD a partir de createdAt. */
  dateKey: string | null;
  dateLabel: string | null;
};

export type OrgGroupBy = "none" | "folder" | "category" | "date";

export type OrgMetaFilters = {
  genre: string | null;
  pool: string | null;
  month: string | null;
  category: string | null;
  folder: string | null;
  editType: string | null;
};

export type OrgFacetKey = keyof OrgMetaFilters;

export type OrgFacets = {
  genre: string[];
  pool: string[];
  month: string[];
  category: string[];
  folder: string[];
  editType: string[];
};

export const EMPTY_ORG_FILTERS: OrgMetaFilters = {
  genre: null,
  pool: null,
  month: null,
  category: null,
  folder: null,
  editType: null,
};

export const ORG_GROUP_LABELS: Record<OrgGroupBy, string> = {
  none: "Sem agrupamento",
  folder: "Pasta",
  category: "Categoria",
  date: "Data",
};

export const ORG_FACET_LABELS: Record<OrgFacetKey, string> = {
  genre: "Gênero",
  pool: "Pool",
  month: "Mês",
  category: "Categoria",
  folder: "Pasta",
  editType: "Tipo de edit",
};

/** Reconhece pools só quando o texto do job contém o token (não cria opções vazias). */
const POOL_DETECTORS: { label: string; pattern: RegExp }[] = [
  { label: "DMC", pattern: /\bDMC\b/i },
  { label: "Ultimix", pattern: /\bUltimix\b/i },
  { label: "Digster", pattern: /\bDigster\b/i },
  { label: "BPM Supreme", pattern: /\bBPM\s*Supreme\b/i },
  { label: "Music Producer", pattern: /\bMusic\s*Producer\b/i },
  { label: "Crackboy", pattern: /\bCrackboy\b/i },
  { label: "LatinHits", pattern: /\bLatin\s*Hits\b/i },
];

const MONTH_SEGMENT_RE =
  /^(janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+\d{4}$/i;
const WEEK_SEGMENT_RE = /^semana\s*0*\d+$/i;
const AUDIO_FILE_RE = /\.(mp3|wav|flac|aiff?|m4a|ogg|aac)$/i;

function splitPath(relativePath: string | null | undefined): string[] {
  if (!relativePath?.trim()) return [];
  return relativePath
    .split(/[/\\]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isMonthSegment(value: string) {
  return MONTH_SEGMENT_RE.test(value.replace(/\s*\[[^\]]+\]\s*/gi, " ").trim());
}

function isWeekSegment(value: string) {
  return WEEK_SEGMENT_RE.test(value.replace(/\s*\[[^\]]+\]\s*/gi, " ").trim());
}

function normalizeWeekLabel(value: string) {
  const match = value.match(/semana\s*0*(\d+)/i);
  if (!match) return value.trim();
  return `Semana ${String(Number(match[1])).padStart(2, "0")}`;
}

function normalizeMonthLabel(value: string) {
  return value.replace(/\s*\[[^\]]+\]\s*/gi, " ").trim();
}

function detectPool(...sources: Array<string | null | undefined>): string | null {
  const haystack = sources.filter(Boolean).join(" ");
  if (!haystack) return null;
  for (const detector of POOL_DETECTORS) {
    if (detector.pattern.test(haystack)) return detector.label;
  }
  return null;
}

function detectEditType(fileName: string): string | null {
  const base = fileName.replace(AUDIO_FILE_RE, "").trim();
  const matches = [...base.matchAll(/\(([^)]+)\)/g)].map((match) => match[1].trim()).filter(Boolean);
  for (const candidate of matches) {
    if (
      /edit|mix|bootleg|acapella|a\s*cappella|instrumental|mashup|remix|extended|radio|club|mixshow|vip|dirty|clean/i.test(
        candidate,
      )
    ) {
      return candidate;
    }
  }
  return null;
}

function dateKeyFromIso(iso: string | null | undefined): { key: string; label: string } | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const label = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return { key, label };
}

export function extractJobOrgMeta(job: DownloadJob): JobOrgMeta {
  const segments = splitPath(job.relativePath);
  const fileSegment =
    segments.length > 0 && AUDIO_FILE_RE.test(segments[segments.length - 1])
      ? segments[segments.length - 1]
      : null;
  const dirSegments = fileSegment ? segments.slice(0, -1) : segments;

  let month: string | null = null;
  let week: string | null = null;
  const styleSegments: string[] = [];

  for (const segment of dirSegments) {
    if (!month && isMonthSegment(segment)) {
      month = normalizeMonthLabel(segment);
      continue;
    }
    if (!week && isWeekSegment(segment)) {
      week = normalizeWeekLabel(segment);
      continue;
    }
    styleSegments.push(segment);
  }

  const genre = styleSegments.length > 0 ? styleSegments[styleSegments.length - 1] : null;
  const folder = dirSegments.length > 0 ? dirSegments.join("/") : null;
  const pool = detectPool(job.fileName, job.relativePath);
  const editType = detectEditType(job.fileName);
  const dateInfo = dateKeyFromIso(job.createdAt) ?? dateKeyFromIso(job.updatedAt);

  return {
    month,
    week,
    genre,
    category: genre,
    folder,
    pool,
    editType,
    dateKey: dateInfo?.key ?? null,
    dateLabel: dateInfo?.label ?? null,
  };
}

function uniqueSorted(values: Iterable<string>) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}

/** Facetas só com valores realmente presentes nos jobs. */
export function collectOrgFacets(jobs: DownloadJob[]): OrgFacets {
  const genre = new Set<string>();
  const pool = new Set<string>();
  const month = new Set<string>();
  const category = new Set<string>();
  const folder = new Set<string>();
  const editType = new Set<string>();

  for (const job of jobs) {
    if (job.status === "CANCELLED") continue;
    const meta = extractJobOrgMeta(job);
    if (meta.genre) genre.add(meta.genre);
    if (meta.pool) pool.add(meta.pool);
    if (meta.month) month.add(meta.month);
    if (meta.category) category.add(meta.category);
    if (meta.folder) folder.add(meta.folder);
    if (meta.editType) editType.add(meta.editType);
  }

  return {
    genre: uniqueSorted(genre),
    pool: uniqueSorted(pool),
    month: uniqueSorted(month),
    category: uniqueSorted(category),
    folder: uniqueSorted(folder),
    editType: uniqueSorted(editType),
  };
}

export function jobMatchesOrgFilters(job: DownloadJob, filters: OrgMetaFilters): boolean {
  const meta = extractJobOrgMeta(job);
  if (filters.genre && meta.genre !== filters.genre) return false;
  if (filters.pool && meta.pool !== filters.pool) return false;
  if (filters.month && meta.month !== filters.month) return false;
  if (filters.category && meta.category !== filters.category) return false;
  if (filters.folder && meta.folder !== filters.folder) return false;
  if (filters.editType && meta.editType !== filters.editType) return false;
  return true;
}

export function filterJobsByOrgMeta(jobs: DownloadJob[], filters: OrgMetaFilters): DownloadJob[] {
  const active = Object.values(filters).some(Boolean);
  if (!active) return jobs;
  return jobs.filter((job) => jobMatchesOrgFilters(job, filters));
}

export type OrgJobGroup = {
  key: string;
  label: string;
  jobs: DownloadJob[];
};

export function groupJobsByOrg(jobs: DownloadJob[], groupBy: OrgGroupBy): OrgJobGroup[] {
  if (groupBy === "none" || jobs.length === 0) {
    return [{ key: "all", label: "Todos", jobs }];
  }

  const buckets = new Map<string, DownloadJob[]>();

  for (const job of jobs) {
    const meta = extractJobOrgMeta(job);
    let key = "—";

    if (groupBy === "folder") {
      key = meta.folder ?? "__none__";
    } else if (groupBy === "category") {
      key = meta.category ?? "__none__";
    } else if (groupBy === "date") {
      key = meta.dateKey ?? "__none__";
    }

    const list = buckets.get(key);
    if (list) list.push(job);
    else buckets.set(key, [job]);
  }

  return [...buckets.entries()]
    .map(([key, groupJobs]) => {
      const meta = groupJobs[0] ? extractJobOrgMeta(groupJobs[0]) : null;
      let label = key;
      if (key === "__none__") {
        label =
          groupBy === "date" ? "Sem data" : groupBy === "folder" ? "Sem pasta" : "Sem categoria";
      } else if (groupBy === "folder") {
        label = meta?.folder ?? "Sem pasta";
      } else if (groupBy === "category") {
        label = meta?.category ?? "Sem categoria";
      } else if (groupBy === "date") {
        label = meta?.dateLabel ?? "Sem data";
      }
      return { key, label, jobs: groupJobs };
    })
    .sort((a, b) => {
      if (a.key === "__none__") return 1;
      if (b.key === "__none__") return -1;
      if (groupBy === "date") return b.key.localeCompare(a.key);
      return a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" });
    });
}

export function hasAnyOrgFacet(facets: OrgFacets) {
  return Object.values(facets).some((list) => list.length > 0);
}
