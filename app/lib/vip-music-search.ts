import { listDriveFolderChildren, parseTrackMeta } from "./google-drive";
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

const FOLDER_MIME = "application/vnd.google-apps.folder";
const STYLE_SCAN_CONCURRENCY = 10;
const DEFAULT_LIMIT = 36;

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
};

function childrenAreDateFolders(
  folders: { name: string }[],
): boolean {
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

/**
 * Busca no acervo VIP de Atualizações.
 * Hierarquias suportadas:
 * - mês → dia (29-SET-2026) → pool → estilo → faixas
 * - mês → semana → estilo → faixas
 * - mês → estilo → faixas
 */
export async function searchVipMusic(query: string, limit = DEFAULT_LIMIT): Promise<VipMusicSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const max = Math.min(Math.max(limit, 1), 60);
  const results: VipMusicSearchHit[] = [];
  const styleTargets: StyleScanTarget[] = [];

  const months = await listVipMonthFolders();

  const monthTrees = await mapPool(months, 6, async (month) => {
    const monthSlug = slugifyFolderName(month.name);
    const monthLabel = displayFolderName(month.name);
    const monthChildren = await listVipMusicFolders(month.id);
    return { month, monthSlug, monthLabel, monthChildren };
  });

  for (const { month, monthSlug, monthLabel, monthChildren } of monthTrees) {
    if (results.length >= max && styleTargets.length > 80) break;

    if (matches(month.name, q) || matches(monthLabel, q)) {
      if (results.length < max) {
        results.push({
          type: "month",
          id: month.id,
          label: monthLabel,
          path: "Acervo VIP",
          monthSlug,
        });
      }
    }

    // Hierarquia atual: mês → dias → pools → estilos
    if (childrenAreDateFolders(monthChildren)) {
      const dateFolders = sortDatesNewestFirst(monthChildren);
      const dateTrees = await mapPool(dateFolders.slice(0, 40), 6, async (dateFolder) => {
        const dateLabel = displayFolderName(dateFolder.name);
        const pools = await listVipMusicFolders(dateFolder.id);
        return { dateFolder, dateLabel, pools };
      });

      for (const { dateFolder, dateLabel, pools } of dateTrees) {
        if (matches(dateFolder.name, q) || matches(dateLabel, q)) {
          if (results.length < max) {
            results.push({
              type: "week",
              id: dateFolder.id,
              label: dateLabel,
              path: monthLabel,
              monthSlug,
              weekSlug: slugifyFolderName(dateFolder.name),
            });
          }
        }

        const poolTrees = await mapPool(pools, 6, async (pool) => {
          const poolLabel = displayFolderName(pool.name);
          const styles = await listVipMusicFolders(pool.id);
          return { pool, poolLabel, styles };
        });

        for (const { pool, poolLabel, styles } of poolTrees) {
          if (matches(pool.name, q) || matches(poolLabel, q)) {
            if (results.length < max) {
              results.push({
                type: "style",
                id: pool.id,
                label: poolLabel,
                path: `${monthLabel} · ${dateLabel}`,
                monthSlug,
                weekSlug: slugifyFolderName(dateFolder.name),
                styleSlug: slugifyFolderName(pool.name),
                styleFolderId: pool.id,
              });
            }
          }

          for (const style of styles) {
            const styleSlug = slugifyFolderName(style.name);
            const styleLabel = displayFolderName(style.name);
            const relativePath = `${monthLabel}/${dateLabel}/${poolLabel}/${styleLabel}`.slice(0, 900);

            if (matches(style.name, q) || matches(styleLabel, q)) {
              if (results.length < max) {
                results.push({
                  type: "style",
                  id: style.id,
                  label: styleLabel,
                  path: `${monthLabel} · ${dateLabel} · ${poolLabel}`,
                  monthSlug,
                  weekSlug: slugifyFolderName(dateFolder.name),
                  styleSlug,
                  styleFolderId: style.id,
                });
              }
            }

            styleTargets.push({
              id: style.id,
              name: style.name,
              monthSlug,
              monthLabel,
              weekSlug: slugifyFolderName(dateFolder.name),
              weekLabel: dateLabel,
              relativePath,
            });
          }
        }
      }
      continue;
    }

    // Hierarquia legada: mês → semanas → estilos
    if (childrenAreWeekFolders(monthChildren)) {
      const weekTrees = await mapPool(monthChildren, 6, async (week) => {
        const weekSlug = slugifyFolderName(week.name);
        const weekLabel = displayFolderName(week.name);
        const styles = await listVipMusicFolders(week.id);
        return { week, weekSlug, weekLabel, styles };
      });

      for (const { week, weekSlug, weekLabel, styles } of weekTrees) {
        if (matches(week.name, q) || matches(weekLabel, q)) {
          if (results.length < max) {
            results.push({
              type: "week",
              id: week.id,
              label: weekLabel,
              path: monthLabel,
              monthSlug,
              weekSlug,
            });
          }
        }

        for (const style of styles) {
          const styleSlug = slugifyFolderName(style.name);
          const styleLabel = displayFolderName(style.name);
          if (matches(style.name, q) || matches(styleLabel, q)) {
            if (results.length < max) {
              results.push({
                type: "style",
                id: style.id,
                label: styleLabel,
                path: `${monthLabel} · ${weekLabel}`,
                monthSlug,
                weekSlug,
                styleSlug,
                styleFolderId: style.id,
              });
            }
          }
          styleTargets.push({
            id: style.id,
            name: style.name,
            monthSlug,
            monthLabel,
            weekSlug,
            weekLabel,
            relativePath: `${monthLabel}/${weekLabel}/${styleLabel}`.slice(0, 900),
          });
        }
      }
      continue;
    }

    // Fallback: estilos direto no mês
    for (const style of monthChildren) {
      if (!isMonthFolderName(month.name) && isYearFolderName(month.name)) continue;
      const styleSlug = slugifyFolderName(style.name);
      const styleLabel = displayFolderName(style.name);
      if (matches(style.name, q) || matches(styleLabel, q)) {
        if (results.length < max) {
          results.push({
            type: "style",
            id: style.id,
            label: styleLabel,
            path: monthLabel,
            monthSlug,
            styleSlug,
            styleFolderId: style.id,
          });
        }
      }
      styleTargets.push({
        id: style.id,
        name: style.name,
        monthSlug,
        monthLabel,
        relativePath: `${monthLabel}/${styleLabel}`.slice(0, 900),
      });
    }
  }

  if (styleTargets.length > 0) {
    const remaining = Math.max(max - results.filter((item) => item.type === "track").length, max);
    const trackHits = await scanStyleTracks(styleTargets, q, Math.min(remaining, max));
    // Faixas primeiro — o Downloader e a UI de busca priorizam músicas
    const folders = results.filter((item) => item.type !== "track");
    return [...trackHits, ...folders].slice(0, max);
  }

  return results.slice(0, max);
}

async function scanStyleTracks(
  targets: StyleScanTarget[],
  q: string,
  limit: number,
): Promise<VipMusicSearchHit[]> {
  if (limit <= 0 || targets.length === 0) return [];

  const hits: VipMusicSearchHit[] = [];
  let stop = false;

  await mapPool(targets, STYLE_SCAN_CONCURRENCY, async (style) => {
    if (stop || hits.length >= limit) return;

    try {
      const children = await listDriveFolderChildren(style.id);
      if (stop || hits.length >= limit) return;

      const styleSlug = slugifyFolderName(style.name);
      const styleLabel = displayFolderName(style.name);
      const path = style.weekLabel
        ? `${style.monthLabel} · ${style.weekLabel} · ${styleLabel}`
        : `${style.monthLabel} · ${styleLabel}`;

      const considerFile = (file: { id: string; name: string; mimeType?: string | null }, nestedLabel?: string) => {
        if (hits.length >= limit) {
          stop = true;
          return;
        }
        const mimeType = file.mimeType ?? "";
        if (!isDriveAudioFile({ name: file.name, mimeType })) return;

        const meta = parseTrackMeta(file.name);
        const haystack = [meta.title, meta.artist, meta.version, style.name, nestedLabel, file.name]
          .filter(Boolean)
          .join(" ");
        if (!matches(haystack, q)) return;

        const display = getTrackDisplayMetadata({
          fileName: file.name,
          ...meta,
        });
        const relativePath = nestedLabel
          ? `${style.relativePath}/${nestedLabel}`.slice(0, 900)
          : style.relativePath;

        hits.push({
          type: "track",
          id: file.id,
          label: display.artist ? `${display.title} — ${display.artist}` : display.title,
          path: nestedLabel ? `${path} · ${nestedLabel}` : path,
          monthSlug: style.monthSlug,
          weekSlug: style.weekSlug,
          styleSlug,
          styleFolderId: style.id,
          fileName: file.name,
          title: display.title,
          artist: display.artist,
          version: meta.version,
          bpm: meta.bpmFrom,
          relativePath,
        });
      };

      for (const file of children) {
        considerFile(file);
        if (stop) return;
      }

      const nestedFolders = children.filter((item) => item.mimeType === FOLDER_MIME).slice(0, 12);
      if (nestedFolders.length === 0 || hits.length >= limit) return;

      await mapPool(nestedFolders, 4, async (folder) => {
        if (stop || hits.length >= limit) return;
        try {
          const nested = await listDriveFolderChildren(folder.id);
          const nestedLabel = displayFolderName(folder.name);
          for (const file of nested) {
            considerFile(file, nestedLabel);
            if (stop) return;
          }
        } catch {
          /* pasta inacessível */
        }
      });
    } catch {
      /* pasta inacessível */
    }
  });

  return hits.slice(0, limit);
}
