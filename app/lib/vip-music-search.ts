import { listDriveFolderChildrenLite, parseTrackMeta } from "./google-drive";
import { getTrackDisplayMetadata } from "./track-display-metadata";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import { listVipMusicFolders } from "./vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  isMonthFolderName,
  isUpdateDateFolderName,
  isYearFolderName,
  parseMonthFolderDate,
  parseUpdateDateFolder,
  slugifyFolderName,
} from "./vip-music-slugs";

export type VipMusicSearchHit = {
  type: "month" | "week" | "style" | "track";
  id: string;
  label: string;
  path: string;
  monthSlug: string;
  weekSlug?: string;
  styleSlug?: string;
  styleFolderId?: string;
  /** Metadados extras para o Downloader / fila. */
  fileName?: string;
  title?: string;
  artist?: string;
  version?: string | null;
  bpm?: number | null;
  relativePath?: string;
};

export type VipMusicSearchOptions = {
  /** Só retorna faixas (Downloader). */
  tracksOnly?: boolean;
  /** Quantos meses mais recentes varrer na 1ª passagem. */
  recentMonths?: number;
  /** Quantos dias mais recentes varrer na 1ª passagem. */
  recentDays?: number;
};

const FOLDER_MIME = "application/vnd.google-apps.folder";
const DEFAULT_LIMIT = 36;
const QUERY_CACHE_TTL_MS = 90_000;
const STYLE_INDEX_TTL_MS = 5 * 60_000;
const TRACK_INDEX_TTL_MS = 10 * 60_000;
const TRACK_INDEX_CONCURRENCY = 16;
const DEFAULT_RECENT_MONTHS = 2;
const DEFAULT_RECENT_DAYS = 14;
const EXPAND_RECENT_MONTHS = 6;
const EXPAND_RECENT_DAYS = 40;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Tokens de busca sem pontuação — "Thommie G (Original Mix)" → thommie g original mix */
function tokenize(query: string) {
  return normalize(query)
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function matches(text: string, query: string) {
  const hay = normalize(text);
  const compactQuery = tokenize(query).join(" ");
  if (!compactQuery) return false;
  if (hay.includes(compactQuery)) return true;
  const parts = tokenize(query);
  return parts.every((part) => hay.includes(part));
}

type StyleScanTarget = {
  id: string;
  name: string;
  monthSlug: string;
  monthLabel: string;
  weekSlug?: string;
  weekLabel?: string;
  relativePath: string;
  /** Ordenação: dias/meses mais novos primeiro. */
  sortKey: string;
};

type FolderHitSeed = VipMusicSearchHit;

type StyleIndex = {
  styles: StyleScanTarget[];
  folderHits: FolderHitSeed[];
};

const queryCache = new Map<string, { expiresAt: number; results: VipMusicSearchHit[] }>();

function childrenAreDateFolders(folders: { name: string }[]): boolean {
  if (folders.length === 0) return false;
  const dates = folders.filter((folder) => isUpdateDateFolderName(folder.name)).length;
  return dates >= Math.max(1, Math.ceil(folders.length * 0.5));
}

function sortMonthsNewestFirst<T extends { name: string }>(folders: T[]): T[] {
  return [...folders].sort((a, b) => {
    const da = parseMonthFolderDate(a.name);
    const db = parseMonthFolderDate(b.name);
    if (da && db) {
      if (da.year !== db.year) return db.year - da.year;
      return db.month - da.month;
    }
    if (da) return -1;
    if (db) return 1;
    return b.name.localeCompare(a.name, "pt-BR", { sensitivity: "base" });
  });
}

function sortDatesNewestFirst<T extends { name: string }>(folders: T[]): T[] {
  return [...folders].sort((a, b) => {
    const da = parseUpdateDateFolder(a.name)?.key ?? "";
    const db = parseUpdateDateFolder(b.name)?.key ?? "";
    return db.localeCompare(da);
  });
}

/**
 * Expande a raiz do acervo VIP em pastas de mês.
 * Suporta raiz = anos (`2026`) ou meses (`Setembro 2026`).
 */
async function listVipMonthFolders() {
  const roots = await listVipMusicFolders();
  const months: { id: string; name: string }[] = [];

  await mapPool(roots, 6, async (root) => {
    if (isYearFolderName(root.name)) {
      const yearChildren = await listVipMusicFolders(root.id);
      for (const child of yearChildren) {
        months.push(child);
      }
      return;
    }
    months.push(root);
  });

  return sortMonthsNewestFirst(months);
}

async function buildStyleIndex(options?: {
  maxMonths?: number;
  maxDays?: number;
}): Promise<StyleIndex> {
  const maxMonths = options?.maxMonths ?? 24;
  const maxDays = options?.maxDays ?? 80;
  const styles: StyleScanTarget[] = [];
  const folderHits: FolderHitSeed[] = [];
  const months = (await listVipMonthFolders()).slice(0, maxMonths);
  let daysCollected = 0;

  // Meses em série (já limitados) para poder parar ao atingir maxDays.
  for (const month of months) {
    if (daysCollected >= maxDays) break;

    const monthSlug = slugifyFolderName(month.name);
    const monthLabel = displayFolderName(month.name);
    const monthChildren = await listVipMusicFolders(month.id);

    folderHits.push({
      type: "month",
      id: month.id,
      label: monthLabel,
      path: "Acervo VIP",
      monthSlug,
    });

    if (childrenAreDateFolders(monthChildren)) {
      const remainingDays = Math.max(0, maxDays - daysCollected);
      const dateFolders = sortDatesNewestFirst(monthChildren).slice(0, remainingDays);
      daysCollected += dateFolders.length;

      const dateTrees = await mapPool(dateFolders, 6, async (dateFolder) => {
        const dateLabel = displayFolderName(dateFolder.name);
        const dateKey = parseUpdateDateFolder(dateFolder.name)?.key ?? dateFolder.name;
        const pools = await listVipMusicFolders(dateFolder.id);
        return { dateFolder, dateLabel, dateKey, pools };
      });

      for (const { dateFolder, dateLabel, dateKey, pools } of dateTrees) {
        folderHits.push({
          type: "week",
          id: dateFolder.id,
          label: dateLabel,
          path: monthLabel,
          monthSlug,
          weekSlug: slugifyFolderName(dateFolder.name),
        });

        const poolTrees = await mapPool(pools, 8, async (pool) => {
          const poolLabel = displayFolderName(pool.name);
          const poolStyles = await listVipMusicFolders(pool.id);
          return { pool, poolLabel, styles: poolStyles };
        });

        for (const { pool, poolLabel, styles: poolStyles } of poolTrees) {
          folderHits.push({
            type: "style",
            id: pool.id,
            label: poolLabel,
            path: `${monthLabel} · ${dateLabel}`,
            monthSlug,
            weekSlug: slugifyFolderName(dateFolder.name),
            styleSlug: slugifyFolderName(pool.name),
            styleFolderId: pool.id,
          });

          for (const style of poolStyles) {
            const styleSlug = slugifyFolderName(style.name);
            const styleLabel = displayFolderName(style.name);
            folderHits.push({
              type: "style",
              id: style.id,
              label: styleLabel,
              path: `${monthLabel} · ${dateLabel} · ${poolLabel}`,
              monthSlug,
              weekSlug: slugifyFolderName(dateFolder.name),
              styleSlug,
              styleFolderId: style.id,
            });
            styles.push({
              id: style.id,
              name: style.name,
              monthSlug,
              monthLabel,
              weekSlug: slugifyFolderName(dateFolder.name),
              weekLabel: dateLabel,
              relativePath: `${monthLabel}/${dateLabel}/${poolLabel}/${styleLabel}`.slice(0, 900),
              sortKey: `${dateKey}|${poolLabel}|${styleLabel}`,
            });
          }
        }
      }
      continue;
    }

    if (childrenAreWeekFolders(monthChildren)) {
      const weekTrees = await mapPool(monthChildren, 6, async (week) => {
        const weekSlug = slugifyFolderName(week.name);
        const weekLabel = displayFolderName(week.name);
        const weekStyles = await listVipMusicFolders(week.id);
        return { week, weekSlug, weekLabel, styles: weekStyles };
      });

      for (const { week, weekSlug, weekLabel, styles: weekStyles } of weekTrees) {
        folderHits.push({
          type: "week",
          id: week.id,
          label: weekLabel,
          path: monthLabel,
          monthSlug,
          weekSlug,
        });

        for (const style of weekStyles) {
          const styleSlug = slugifyFolderName(style.name);
          const styleLabel = displayFolderName(style.name);
          folderHits.push({
            type: "style",
            id: style.id,
            label: styleLabel,
            path: `${monthLabel} · ${weekLabel}`,
            monthSlug,
            weekSlug,
            styleSlug,
            styleFolderId: style.id,
          });
          styles.push({
            id: style.id,
            name: style.name,
            monthSlug,
            monthLabel,
            weekSlug,
            weekLabel,
            relativePath: `${monthLabel}/${weekLabel}/${styleLabel}`.slice(0, 900),
            sortKey: `${monthSlug}|${weekSlug}|${styleLabel}`,
          });
        }
      }
      continue;
    }

    for (const style of monthChildren) {
      if (!isMonthFolderName(month.name) && isYearFolderName(month.name)) continue;
      const styleSlug = slugifyFolderName(style.name);
      const styleLabel = displayFolderName(style.name);
      folderHits.push({
        type: "style",
        id: style.id,
        label: styleLabel,
        path: monthLabel,
        monthSlug,
        styleSlug,
        styleFolderId: style.id,
      });
      styles.push({
        id: style.id,
        name: style.name,
        monthSlug,
        monthLabel,
        relativePath: `${monthLabel}/${styleLabel}`.slice(0, 900),
        sortKey: `${monthSlug}|${styleLabel}`,
      });
    }
  }

  styles.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return { styles, folderHits };
}

type IndexMemo = { value: StyleIndex; expiresAt: number };
const styleIndexByScope = new Map<string, IndexMemo>();
const styleIndexInflightByScope = new Map<string, Promise<StyleIndex>>();

async function getStyleIndex(maxMonths: number, maxDays: number): Promise<StyleIndex> {
  const scope = `${maxMonths}:${maxDays}`;
  const memo = styleIndexByScope.get(scope);
  if (memo && memo.expiresAt > Date.now()) return memo.value;

  const inflight = styleIndexInflightByScope.get(scope);
  if (inflight) return inflight;

  const promise = buildStyleIndex({ maxMonths, maxDays })
    .then((value) => {
      styleIndexByScope.set(scope, { value, expiresAt: Date.now() + STYLE_INDEX_TTL_MS });
      return value;
    })
    .finally(() => {
      styleIndexInflightByScope.delete(scope);
    });

  styleIndexInflightByScope.set(scope, promise);
  return promise;
}

type IndexedAudio = {
  id: string;
  fileName: string;
  /** Texto já normalizado para o match não refazer o Drive. */
  haystack: string;
  monthSlug: string;
  monthLabel: string;
  weekSlug?: string;
  weekLabel?: string;
  styleName: string;
  styleFolderId: string;
  relativePath: string;
  path: string;
};

type TrackCatalogIndex = {
  tracks: IndexedAudio[];
  folderHits: FolderHitSeed[];
};

const trackIndexByScope = new Map<string, { value: TrackCatalogIndex; expiresAt: number }>();
const trackIndexInflightByScope = new Map<string, Promise<TrackCatalogIndex>>();

function pushAudioFile(
  out: IndexedAudio[],
  style: StyleScanTarget,
  file: { id: string; name: string; mimeType?: string | null },
  path: string,
  nestedLabel?: string,
) {
  const mimeType = file.mimeType ?? "";
  if (!isDriveAudioFile({ name: file.name, mimeType })) return;
  const meta = parseTrackMeta(file.name);
  const styleLabel = displayFolderName(style.name);
  const itemPath = nestedLabel ? `${path} · ${nestedLabel}` : path;
  const relativePath = nestedLabel
    ? `${style.relativePath}/${nestedLabel}`.slice(0, 900)
    : style.relativePath;
  out.push({
    id: file.id,
    fileName: file.name,
    haystack: normalize(
      `${file.name} ${meta.title} ${meta.artist} ${meta.version ?? ""} ${style.name} ${styleLabel} ${nestedLabel ?? ""} ${itemPath}`,
    ),
    monthSlug: style.monthSlug,
    monthLabel: style.monthLabel,
    weekSlug: style.weekSlug,
    weekLabel: style.weekLabel,
    styleName: style.name,
    styleFolderId: style.id,
    relativePath,
    path: itemPath,
  });
}

async function collectStyleAudio(style: StyleScanTarget): Promise<IndexedAudio[]> {
  const children = await listDriveFolderChildrenLite(style.id);
  const styleLabel = displayFolderName(style.name);
  const path = style.weekLabel
    ? `${style.monthLabel} · ${style.weekLabel} · ${styleLabel}`
    : `${style.monthLabel} · ${styleLabel}`;
  const out: IndexedAudio[] = [];

  for (const file of children) {
    pushAudioFile(out, style, file, path);
  }

  const hasDirectAudio = children.some((item) =>
    isDriveAudioFile({ name: item.name, mimeType: item.mimeType ?? "" }),
  );
  if (hasDirectAudio) return out;

  const nestedFolders = children.filter((item) => item.mimeType === FOLDER_MIME).slice(0, 8);
  if (nestedFolders.length === 0) return out;

  const nestedGroups = await mapPool(nestedFolders, 4, async (folder) => {
    try {
      const nested = await listDriveFolderChildrenLite(folder.id);
      const nestedLabel = displayFolderName(folder.name);
      const files: IndexedAudio[] = [];
      for (const file of nested) {
        pushAudioFile(files, style, file, path, nestedLabel);
      }
      return files;
    } catch {
      return [];
    }
  });

  for (const group of nestedGroups) out.push(...group);
  return out;
}

/**
 * Lista os arquivos do recorte uma vez e reutiliza nas buscas seguintes.
 * Antes, cada consulta reabria todas as pastas de estilo no Drive.
 */
async function buildTrackCatalogIndex(maxMonths: number, maxDays: number): Promise<TrackCatalogIndex> {
  const styleIndex = await getStyleIndex(maxMonths, maxDays);
  const groups = await mapPool(styleIndex.styles, TRACK_INDEX_CONCURRENCY, async (style) => {
    try {
      return await collectStyleAudio(style);
    } catch {
      return [];
    }
  });

  const tracks: IndexedAudio[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const track of group) {
      if (seen.has(track.id)) continue;
      seen.add(track.id);
      tracks.push(track);
    }
  }

  return { tracks, folderHits: styleIndex.folderHits };
}

async function getTrackCatalogIndex(maxMonths: number, maxDays: number): Promise<TrackCatalogIndex> {
  const scope = `${maxMonths}:${maxDays}`;
  const memo = trackIndexByScope.get(scope);
  if (memo && memo.expiresAt > Date.now()) return memo.value;

  const inflight = trackIndexInflightByScope.get(scope);
  if (inflight) return inflight;

  const promise = buildTrackCatalogIndex(maxMonths, maxDays)
    .then((value) => {
      trackIndexByScope.set(scope, { value, expiresAt: Date.now() + TRACK_INDEX_TTL_MS });
      return value;
    })
    .finally(() => {
      trackIndexInflightByScope.delete(scope);
    });

  trackIndexInflightByScope.set(scope, promise);
  return promise;
}

function indexedToHit(track: IndexedAudio): VipMusicSearchHit {
  const meta = parseTrackMeta(track.fileName);
  const display = getTrackDisplayMetadata({
    fileName: track.fileName,
    ...meta,
  });
  return {
    type: "track",
    id: track.id,
    label: display.artist ? `${display.title} — ${display.artist}` : display.title,
    path: track.path,
    monthSlug: track.monthSlug,
    weekSlug: track.weekSlug,
    styleSlug: slugifyFolderName(track.styleName),
    styleFolderId: track.styleFolderId,
    fileName: track.fileName,
    title: display.title,
    artist: display.artist,
    version: meta.version,
    bpm: meta.bpmFrom,
    relativePath: track.relativePath,
  };
}

function matchIndexedTracks(
  tracks: IndexedAudio[],
  query: string,
  limit: number,
  skip?: Set<string>,
): VipMusicSearchHit[] {
  if (limit <= 0) return [];
  const hits: VipMusicSearchHit[] = [];
  for (const track of tracks) {
    if (skip?.has(track.id)) continue;
    if (!matches(track.haystack, query)) continue;
    hits.push(indexedToHit(track));
    if (hits.length >= limit) break;
  }
  return hits;
}

/**
 * Busca no acervo VIP de Atualizações.
 * O índice de faixas fica em memória (~10 min). Consultas seguintes não reabrem o Drive.
 */
export async function searchVipMusic(
  query: string,
  limit = DEFAULT_LIMIT,
  options?: VipMusicSearchOptions,
): Promise<VipMusicSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const max = Math.min(Math.max(limit, 1), 60);
  const tracksOnly = Boolean(options?.tracksOnly);
  const recentMonths = options?.recentMonths ?? DEFAULT_RECENT_MONTHS;
  const recentDays = options?.recentDays ?? DEFAULT_RECENT_DAYS;
  const cacheKey = `${tracksOnly ? "t" : "a"}:${recentMonths}:${recentDays}:${max}:${normalize(q)}`;
  const cached = queryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const catalog = await getTrackCatalogIndex(recentMonths, recentDays);
  const folderHits: VipMusicSearchHit[] = tracksOnly
    ? []
    : catalog.folderHits.filter((hit) => matches(hit.label, q) || matches(hit.path, q)).slice(0, max);

  let trackHits = matchIndexedTracks(catalog.tracks, q, max);

  // Poucos resultados → amplia a janela. O índice maior também fica em cache.
  if (
    trackHits.length < Math.min(8, max) &&
    (recentMonths < EXPAND_RECENT_MONTHS || recentDays < EXPAND_RECENT_DAYS)
  ) {
    const expanded = await getTrackCatalogIndex(EXPAND_RECENT_MONTHS, EXPAND_RECENT_DAYS);
    const seenIds = new Set(trackHits.map((hit) => hit.id));
    for (const hit of matchIndexedTracks(expanded.tracks, q, max - trackHits.length, seenIds)) {
      seenIds.add(hit.id);
      trackHits.push(hit);
      if (trackHits.length >= max) break;
    }
    if (!tracksOnly) {
      for (const hit of expanded.folderHits) {
        if (folderHits.length >= max) break;
        if (!(matches(hit.label, q) || matches(hit.path, q))) continue;
        if (folderHits.some((existing) => existing.id === hit.id)) continue;
        folderHits.push(hit);
      }
    }
  }

  const results = tracksOnly
    ? trackHits.slice(0, max)
    : [...trackHits, ...folderHits].slice(0, max);

  queryCache.set(cacheKey, { expiresAt: Date.now() + QUERY_CACHE_TTL_MS, results });
  return results;
}

export function clearVipMusicSearchCaches() {
  queryCache.clear();
  styleIndexByScope.clear();
  styleIndexInflightByScope.clear();
  trackIndexByScope.clear();
  trackIndexInflightByScope.clear();
}
