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
const DEFAULT_TRACK_LIMIT = 5000;

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

async function collectStyleLeaves(
  folderId: string,
  context: {
    packSlug?: string;
    packName?: string;
    monthSlug?: string;
    monthName?: string;
    weekSlug?: string;
    weekName?: string;
    __currentName?: string;
  },
  depth = 0,
  visited = new Set<string>(),
): Promise<VipStyleScanTarget[]> {
  if (depth > 8 || visited.has(folderId)) return [];
  visited.add(folderId);

  const children = await listDriveFolderChildren(folderId);
  const audio = children.filter((item) => isDriveAudioFile(item));
  const folders = children.filter((item) => item.mimeType === FOLDER_MIME);
  const out: VipStyleScanTarget[] = [];

  // Uma pasta com MP3 diretamente é um nível final. Só tratamos como
  // "estilo" quando ela não é a própria raiz/pack: isso permite encontrar
  // estilos mesmo em árvores diferentes das atualizações.
  if (audio.length > 0 && folders.length === 0 && depth >= 2) {
    const name = children.length > 0 ? context.__currentName ?? "" : "";
    if (name) {
      const slug = slugifyStyleName(name);
      if (slug) {
        out.push({
          id: folderId,
          name,
          packSlug: context.packSlug,
          packName: context.packName,
          monthSlug: context.monthSlug ?? "",
          monthName: context.monthName ?? "",
          weekSlug: context.weekSlug,
          weekName: context.weekName,
        });
      }
    }
  }

  if (folders.length === 0) return out;

  const nested = await mapPool(folders, 6, async (folder) => {
    const folderName = displayFolderName(folder.name);
    const parsedMonth = isMonthFolderName(folder.name);
    const parsedWeek = isWeekFolderName(folder.name);
    const nextContext = {
      ...context,
      monthSlug: parsedMonth ? slugifyFolderName(folder.name) : context.monthSlug,
      monthName: parsedMonth ? folderName : context.monthName,
      weekSlug: parsedWeek ? slugifyFolderName(folder.name) : context.weekSlug,
      weekName: parsedWeek ? folderName : context.weekName,
      __currentName: folderName,
    };
    return collectStyleLeaves(folder.id, nextContext, depth + 1, visited);
  });

  return [...out, ...nested.flat()];
}

/**
 * Encontra níveis finais com MP3 em qualquer árvore do Drive.
 * A estrutura pode ser Pack → Mês → Semana → Estilo, Mês → Estilo,
 * ou possuir níveis intermediários adicionais.
 */
export async function collectVipStyleTargets(): Promise<VipStyleScanTarget[]> {
  const roots = await listVipMusicFolders();
  if (!roots.length) return [];

  const rootLikeYearCount = roots.filter((folder) => parseYearCollectionFolder(folder.name)).length;
  const rootsArePacks = rootLikeYearCount >= Math.max(1, Math.ceil(roots.length * 0.4));

  const trees = await mapPool(roots, 4, async (root) => {
    const rootName = displayFolderName(root.name);
    const rootSlug = slugifyFolderName(root.name);
    const rootContext = {
      packSlug: rootsArePacks ? rootSlug : undefined,
      packName: rootsArePacks ? rootName : undefined,
      monthSlug: rootsArePacks ? undefined : rootSlug,
      monthName: rootsArePacks ? undefined : rootName,
      __currentName: rootName,
    };
    return collectStyleLeaves(root.id, rootContext, 1, new Set<string>());
  });

  return trees.flat();
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
  const max = Math.min(Math.max(limit, 1), 5000);

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

      const packName = style.packName || style.monthName || displayFolderName(style.name);
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

      const visited = new Set<string>([style.id]);
      const walk = async (folderId: string, depth: number): Promise<void> => {
        if (stop || tracks.length >= max || depth > 8) return;
        const nested = await listDriveFolderChildren(folderId);
        for (const file of nested) {
          if (stop || tracks.length >= max) return;
          if (isDriveAudioFile(file)) consider(file);
        }
        const folders = nested.filter((item) => item.mimeType === FOLDER_MIME);
        await mapPool(folders, 4, async (folder) => {
          if (stop || tracks.length >= max || visited.has(folder.id)) return;
          visited.add(folder.id);
          await walk(folder.id, depth + 1);
        });
      };
      const nestedFolders = children.filter((item) => item.mimeType === FOLDER_MIME);
      await mapPool(nestedFolders, 4, async (folder) => {
        if (stop || tracks.length >= max || visited.has(folder.id)) return;
        visited.add(folder.id);
        await walk(folder.id, 1);
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
