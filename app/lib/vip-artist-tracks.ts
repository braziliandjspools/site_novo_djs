import { listDriveFolderChildren, parseTrackMeta, type PreviewTrack } from "./google-drive";
import { getTrackDisplayMetadata, UNKNOWN_ARTIST_LABEL } from "./track-display-metadata";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import { listVipMusicFolders } from "./vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  slugifyFolderName,
} from "./vip-music-slugs";
import {
  findKnownArtistBySlug,
  knownArtistSlug,
  splitArtistCredits,
  type VipKnownArtist,
} from "./vip-known-artists";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const STYLE_SCAN_CONCURRENCY = 10;
const DEFAULT_TRACK_LIMIT = 200;

export type ArtistTrackHit = PreviewTrack & {
  styleFolderId: string;
  styleName: string;
  monthSlug: string;
  monthName: string;
  weekSlug?: string;
  weekName?: string;
  styleSlug: string;
  href: string;
  relativePath: string;
};

export type ArtistProfileResult = {
  slug: string;
  name: string;
  known: (VipKnownArtist & { slug: string }) | null;
  imageUrl: string | null;
  trackCount: number;
  tracks: ArtistTrackHit[];
};

type StyleScanTarget = {
  id: string;
  name: string;
  monthSlug: string;
  monthName: string;
  weekSlug?: string;
  weekName?: string;
};

function creditMatchesArtistSlug(displayArtist: string, targetSlug: string): boolean {
  if (!displayArtist.trim() || displayArtist === UNKNOWN_ARTIST_LABEL) return false;
  const fullSlug = slugifyFolderName(displayArtist);
  if (fullSlug === targetSlug) return true;

  return splitArtistCredits(displayArtist).some(
    (part) => slugifyFolderName(part) === targetSlug,
  );
}

async function collectStyleTargets(): Promise<StyleScanTarget[]> {
  const months = await listVipMusicFolders();
  const targets: StyleScanTarget[] = [];

  const monthTrees = await mapPool(months, 6, async (month) => {
    const monthSlug = slugifyFolderName(month.name);
    const monthName = displayFolderName(month.name);
    const monthChildren = await listVipMusicFolders(month.id);
    return { monthSlug, monthName, monthChildren };
  });

  for (const { monthSlug, monthName, monthChildren } of monthTrees) {
    if (childrenAreWeekFolders(monthChildren)) {
      const weekTrees = await mapPool(monthChildren, 6, async (week) => {
        const weekSlug = slugifyFolderName(week.name);
        const weekName = displayFolderName(week.name);
        const styles = await listVipMusicFolders(week.id);
        return { weekSlug, weekName, styles };
      });

      for (const { weekSlug, weekName, styles } of weekTrees) {
        for (const style of styles) {
          targets.push({
            id: style.id,
            name: style.name,
            monthSlug,
            monthName,
            weekSlug,
            weekName,
          });
        }
      }
      continue;
    }

    for (const style of monthChildren) {
      targets.push({
        id: style.id,
        name: style.name,
        monthSlug,
        monthName,
      });
    }
  }

  return targets;
}

function toArtistTrack(
  file: { id: string; name: string; createdTime?: string; modifiedTime?: string; size?: string },
  packName: string,
  style: StyleScanTarget,
): ArtistTrackHit | null {
  const meta = parseTrackMeta(file.name);
  const display = getTrackDisplayMetadata({ fileName: file.name, ...meta });
  const styleSlug = slugifyFolderName(style.name);
  const segments = [style.monthSlug, style.weekSlug, styleSlug].filter(Boolean) as string[];

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
    monthSlug: style.monthSlug,
    monthName: style.monthName,
    weekSlug: style.weekSlug,
    weekName: style.weekName,
    styleSlug,
    href: `${folderHref(segments)}?faixa=${encodeURIComponent(file.id)}`,
    relativePath: style.weekName
      ? `${style.monthName}/${style.weekName}/${displayFolderName(style.name)}`
      : `${style.monthName}/${displayFolderName(style.name)}`,
  };
}

/**
 * Varre o acervo VIP e retorna faixas cujo crédito de artista bate com o slug.
 */
export async function findTracksByArtistSlug(
  rawSlug: string,
  limit = DEFAULT_TRACK_LIMIT,
): Promise<ArtistProfileResult> {
  const slug = slugifyFolderName(rawSlug);
  const known = findKnownArtistBySlug(slug);
  const matchSlug = known ? knownArtistSlug(known) : slug;
  const max = Math.min(Math.max(limit, 1), 400);

  if (!matchSlug) {
    return {
      slug: rawSlug,
      name: known?.name ?? rawSlug,
      known,
      imageUrl: known?.imageUrl?.trim() || null,
      trackCount: 0,
      tracks: [],
    };
  }

  const targets = await collectStyleTargets();
  const tracks: ArtistTrackHit[] = [];
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
        const meta = parseTrackMeta(file.name);
        const display = getTrackDisplayMetadata({ fileName: file.name, ...meta });
        if (!creditMatchesArtistSlug(display.artist, matchSlug)) return;
        const hit = toArtistTrack(file, packName, style);
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

  const nameFromTracks =
    tracks.find((track) =>
      splitArtistCredits(track.artist).some((part) => slugifyFolderName(part) === matchSlug),
    )?.artist ?? tracks[0]?.artist;

  const resolvedName =
    known?.name ??
    (nameFromTracks
      ? (splitArtistCredits(nameFromTracks).find((part) => slugifyFolderName(part) === matchSlug) ??
        nameFromTracks)
      : matchSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  const imageUrl =
    known?.imageUrl?.trim() ||
    tracks.find((track) => track.coverUrl?.trim())?.coverUrl?.trim() ||
    null;

  return {
    slug: matchSlug,
    name: resolvedName,
    known,
    imageUrl,
    trackCount: tracks.length,
    tracks: tracks.slice(0, max),
  };
}
