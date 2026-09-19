import { listDriveFolderChildren, parseTrackMeta, type PreviewTrack } from "./google-drive";
import { getTrackDisplayMetadata } from "./track-display-metadata";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import { listVipMusicFolders, type VipMusicFolder } from "./vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  isMonthFolderName,
  isWeekFolderName,
  parseYearCollectionFolder,
  slugifyFolderName,
  slugifyStyleName,
  stylesHref,
} from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const STYLE_SCAN_CONCURRENCY = 10;
const DEFAULT_TRACK_LIMIT = 200;

export type VipStyleScanTarget = {
  id: string;
  name: string;
  packSlug?: string;
  packName?: string;
  monthSlug: string;
  monthName: string;
  weekSlug?: string;
  weekName?: string;
};

export type StyleTrackHit = PreviewTrack & {
  styleFolderId: string;
  styleName: string;
  packSlug?: string;
  packName?: string;
  monthSlug: string;
  monthName: string;
  weekSlug?: string;
  weekName?: string;
  styleSlug: string;
  href: string;
  relativePath: string;
};

export type StyleProfileResult = {
  slug: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  folderCount: number;
  tracks: StyleTrackHit[];
};

export type VipStyleListItem = {
  slug: string;
  name: string;
  folderCount: number;
  href: string;
};

async function walkMonthStyles(
  month: VipMusicFolder,
  ctx: { packSlug?: string; packName?: string },
): Promise<VipStyleScanTarget[]> {
  const monthSlug = slugifyFolderName(month.name);
  const monthName = displayFolderName(month.name);
  if (!monthSlug) return [];

  const monthChildren = await listVipMusicFolders(month.id);
  const out: VipStyleScanTarget[] = [];

  if (childrenAreWeekFolders(monthChildren)) {
    const weekTrees = await mapPool(monthChildren, 6, async (week) => {
      const styles = await listVipMusicFolders(week.id);
      return {
        weekSlug: slugifyFolderName(week.name),
        weekName: displayFolderName(week.name),
        styles,
      };
    });

    for (const { weekSlug, weekName, styles } of weekTrees) {
      for (const style of styles) {
        if (isMonthFolderName(style.name) || isWeekFolderName(style.name)) continue;
        out.push({
          id: style.id,
          name: style.name,
          packSlug: ctx.packSlug,
          packName: ctx.packName,
          monthSlug,
          monthName,
          weekSlug: weekSlug || undefined,
          weekName,
        });
      }
    }
    return out;
  }

  for (const style of monthChildren) {
    if (isMonthFolderName(style.name) || isWeekFolderName(style.name)) continue;
    out.push({
      id: style.id,
      name: style.name,
      packSlug: ctx.packSlug,
      packName: ctx.packName,
      monthSlug,
      monthName,
    });
  }

  return out;
}

/**
 * Lista pastas de estilo no acervo (Pack → Mês → Semana? → Estilo, ou legado Mês → Estilo).
 */
export async function collectVipStyleTargets(): Promise<VipStyleScanTarget[]> {
  const roots = await listVipMusicFolders();
  if (roots.length === 0) return [];

  const yearLike = roots.filter((folder) => parseYearCollectionFolder(folder.name)).length;
  const isPackRoot = yearLike >= Math.max(1, Math.ceil(roots.length * 0.4));

  if (isPackRoot) {
    const nested = await mapPool(roots, 4, async (pack) => {
      const packSlug = slugifyFolderName(pack.name);
      const packName = displayFolderName(pack.name);
      const months = await listVipMusicFolders(pack.id);
      const monthTrees = await mapPool(months, 4, (month) =>
        walkMonthStyles(month, { packSlug, packName }),
      );
      return monthTrees.flat();
    });
    return nested.flat();
  }

  const monthTrees = await mapPool(roots, 6, (month) => walkMonthStyles(month, {}));
  return monthTrees.flat();
}

function stylePathSegments(style: VipStyleScanTarget, styleSlug: string): string[] {
  return [style.packSlug, style.monthSlug, style.weekSlug, styleSlug].filter(
    (part): part is string => Boolean(part),
  );
}

function toStyleTrack(
  file: { id: string; name: string; createdTime?: string; modifiedTime?: string; size?: string },
  packName: string,
  style: VipStyleScanTarget,
): StyleTrackHit | null {
  const meta = parseTrackMeta(file.name);
  const display = getTrackDisplayMetadata({ fileName: file.name, ...meta });
  const styleSlug = slugifyStyleName(style.name);
  const segments = stylePathSegments(style, styleSlug);

  return {
    id: file.id,
    pack: packName,
    fileName: file.name,
    ...meta,
    title: display.title,
    artist: display.artist,
    modifiedAt: file.createdTime ?? file.modifiedTime ?? null,
    sizeBytes:
      file.size != null && file.size !== "" && Number.isFinite(Number(file.size))
        ? Number(file.size)
        : null,
    styleFolderId: style.id,
    styleName: displayFolderName(style.name),
    packSlug: style.packSlug,
    packName: style.packName,
    monthSlug: style.monthSlug,
    monthName: style.monthName,
    weekSlug: style.weekSlug,
    weekName: style.weekName,
    styleSlug,
    href: `${folderHref(segments)}?faixa=${encodeURIComponent(file.id)}`,
    relativePath: [style.packName, style.monthName, style.weekName, displayFolderName(style.name)]
      .filter(Boolean)
      .join("/"),
  };
}

/** Estilos únicos do acervo (para /musicas/estilos). */
export async function listVipMusicStyles(): Promise<VipStyleListItem[]> {
  const targets = await collectVipStyleTargets();
  const bySlug = new Map<string, VipStyleListItem>();

  for (const target of targets) {
    const slug = slugifyStyleName(target.name);
    if (!slug) continue;
    const existing = bySlug.get(slug);
    if (existing) {
      existing.folderCount += 1;
      continue;
    }
    bySlug.set(slug, {
      slug,
      name: displayFolderName(target.name),
      folderCount: 1,
      href: stylesHref(slug),
    });
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/**
 * Agrega faixas de todas as pastas cujo slug de estilo bate com o pedido.
 */
export async function findTracksByStyleSlug(
  rawSlug: string,
  limit = DEFAULT_TRACK_LIMIT,
): Promise<StyleProfileResult> {
  const slug = slugifyStyleName(rawSlug);
  const max = Math.min(Math.max(limit, 1), 400);

  if (!slug) {
    return {
      slug: rawSlug,
      name: rawSlug,
      imageUrl: null,
      trackCount: 0,
      folderCount: 0,
      tracks: [],
    };
  }

  const allTargets = await collectVipStyleTargets();
  const targets = allTargets.filter((target) => slugifyStyleName(target.name) === slug);
  const tracks: StyleTrackHit[] = [];
  let stop = false;

  await mapPool(targets, STYLE_SCAN_CONCURRENCY, async (style) => {
    if (stop || tracks.length >= max) return;

    try {
      const children = await listDriveFolderChildren(style.id);
      if (stop || tracks.length >= max) return;

      const packName = displayFolderName(style.name);
      const consider = (file: (typeof children)[number]) => {
        if (tracks.length >= max) {
          stop = true;
          return;
        }
        if (!isDriveAudioFile(file)) return;
        const hit = toStyleTrack(file, packName, style);
        if (hit) tracks.push(hit);
      };

      for (const file of children) consider(file);

      const nestedFolders = children.filter((item) => item.mimeType === FOLDER_MIME).slice(0, 12);
      if (nestedFolders.length === 0 || tracks.length >= max) return;

      await mapPool(nestedFolders, 4, async (folder) => {
        if (stop || tracks.length >= max) return;
        try {
          const nested = await listDriveFolderChildren(folder.id);
          for (const file of nested) consider(file);
        } catch {
          /* pasta inacessível */
        }
      });
    } catch {
      /* pasta inacessível */
    }
  });

  const resolvedName =
    targets[0] != null
      ? displayFolderName(targets[0].name)
      : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const imageUrl = tracks.find((track) => track.coverUrl?.trim())?.coverUrl?.trim() || null;

  return {
    slug,
    name: resolvedName,
    imageUrl,
    trackCount: tracks.length,
    folderCount: targets.length,
    tracks: tracks.slice(0, max),
  };
}
