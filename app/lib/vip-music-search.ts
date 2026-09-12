import { listDriveFolderChildren, parseTrackMeta } from "./google-drive";
import { getTrackDisplayMetadata } from "./track-display-metadata";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import { listVipMusicFolders } from "./vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
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
};

const FOLDER_MIME = "application/vnd.google-apps.folder";
/** Pastas de estilo/álbum varridas em paralelo na busca de faixas. */
const STYLE_SCAN_CONCURRENCY = 10;
/** Limite padrão de hits (mais baixo = resposta mais rápida). */
const DEFAULT_LIMIT = 36;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function matches(text: string, query: string) {
  return normalize(text).includes(normalize(query));
}

type StyleScanTarget = {
  id: string;
  name: string;
  monthSlug: string;
  monthLabel: string;
  weekSlug?: string;
  weekLabel?: string;
};

/**
 * Busca rápida no acervo VIP.
 * - Pastas: listagens paralelas (mês → semana → estilo)
 * - Faixas: só 1 nível de áudio por pasta de estilo (sem deep-walk)
 */
export async function searchVipMusic(query: string, limit = DEFAULT_LIMIT): Promise<VipMusicSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const max = Math.min(Math.max(limit, 1), 60);
  const results: VipMusicSearchHit[] = [];
  const styleTargets: StyleScanTarget[] = [];

  const months = await listVipMusicFolders();

  // Varre meses em paralelo (listagens leves).
  const monthTrees = await mapPool(months, 6, async (month) => {
    const monthSlug = slugifyFolderName(month.name);
    const monthLabel = displayFolderName(month.name);
    const monthChildren = await listVipMusicFolders(month.id);
    return { month, monthSlug, monthLabel, monthChildren };
  });

  for (const { month, monthSlug, monthLabel, monthChildren } of monthTrees) {
    if (results.length >= max) break;

    if (matches(month.name, q) || matches(monthLabel, q)) {
      results.push({
        type: "month",
        id: month.id,
        label: monthLabel,
        path: "Acervo VIP",
        monthSlug,
      });
    }

    if (childrenAreWeekFolders(monthChildren)) {
      const weekTrees = await mapPool(monthChildren, 6, async (week) => {
        const weekSlug = slugifyFolderName(week.name);
        const weekLabel = displayFolderName(week.name);
        const styles = await listVipMusicFolders(week.id);
        return { week, weekSlug, weekLabel, styles };
      });

      for (const { week, weekSlug, weekLabel, styles } of weekTrees) {
        if (results.length >= max) break;

        if (matches(week.name, q) || matches(weekLabel, q)) {
          results.push({
            type: "week",
            id: week.id,
            label: weekLabel,
            path: monthLabel,
            monthSlug,
            weekSlug,
          });
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
          });
        }
      }
      continue;
    }

    for (const style of monthChildren) {
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
      });
    }
  }

  // Faixas: listagem rasa em paralelo — sem deep-walk caro.
  if (results.length < max && styleTargets.length > 0) {
    const remaining = max - results.length;
    const trackHits = await scanStyleTracks(styleTargets, q, remaining);
    results.push(...trackHits);
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

      // Áudios no nível da pasta de estilo
      for (const file of children) {
        if (hits.length >= limit) {
          stop = true;
          return;
        }
        if (!isDriveAudioFile(file)) continue;

        const meta = parseTrackMeta(file.name);
        const haystack = [meta.title, meta.artist, style.name, file.name].join(" ");
        if (!matches(haystack, q)) continue;

        const display = getTrackDisplayMetadata({
          id: file.id,
          pack: style.name,
          fileName: file.name,
          ...meta,
        });

        hits.push({
          type: "track",
          id: file.id,
          label: display.artist ? `${display.title} — ${display.artist}` : display.title,
          path,
          monthSlug: style.monthSlug,
          weekSlug: style.weekSlug,
          styleSlug,
          styleFolderId: style.id,
        });
      }

      // Um nível extra de subpastas (álbuns dentro do estilo), sem deep-walk infinito
      const nestedFolders = children.filter((item) => item.mimeType === FOLDER_MIME).slice(0, 12);
      if (nestedFolders.length === 0 || hits.length >= limit) return;

      await mapPool(nestedFolders, 4, async (folder) => {
        if (stop || hits.length >= limit) return;
        try {
          const nested = await listDriveFolderChildren(folder.id);
          for (const file of nested) {
            if (hits.length >= limit) {
              stop = true;
              return;
            }
            if (!isDriveAudioFile(file)) continue;
            const meta = parseTrackMeta(file.name);
            const haystack = [meta.title, meta.artist, folder.name, style.name, file.name].join(" ");
            if (!matches(haystack, q)) continue;

            const display = getTrackDisplayMetadata({
              id: file.id,
              pack: folder.name,
              fileName: file.name,
              ...meta,
            });

            hits.push({
              type: "track",
              id: file.id,
              label: display.artist ? `${display.title} — ${display.artist}` : display.title,
              path: `${path} · ${displayFolderName(folder.name)}`,
              monthSlug: style.monthSlug,
              weekSlug: style.weekSlug,
              styleSlug,
              styleFolderId: style.id,
            });
          }
        } catch {
          /* pasta inacessível — ignora */
        }
      });
    } catch {
      /* pasta inacessível — ignora */
    }
  });

  return hits.slice(0, limit);
}
