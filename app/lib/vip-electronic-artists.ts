import { listDriveFolderChildren, parseTrackMeta } from "./google-drive";
import { isDriveAudioFile } from "./folder-cover";
import { mapPool } from "./map-pool";
import { getTrackDisplayMetadata, UNKNOWN_ARTIST_LABEL } from "./track-display-metadata";
import { collectVipStyleTargets } from "./vip-style-tracks";
import { findKnownArtistBySlug, splitArtistCredits } from "./vip-known-artists";
import { artistsHref, slugifyFolderName } from "./vip-music-slugs";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const ELECTRONIC_STYLE = /(?:electro|eletr[oô]nic|house|techno|trance|dance|edm|dubstep|drum.?and.?bass|dnb|hardstyle|progressive|melodic|afro.?house|brazilian.?bass|deep.?house|tech.?house|psytrance|bass.?house|future.?house)/i;
const CACHE_MS = 15 * 60 * 1000;
const MAX_STYLE_FOLDERS = 36;
const MAX_ARTISTS = 150;
const MAX_FILES_PER_STYLE = 350;
type DiscoveredArtist = {
  slug: string;
  name: string;
  imageUrl: string | null;
  shortBio: string | null;
  bio: null;
  genres: string[];
  href: string;
  known: boolean;
  source: "drive";
};
let cached: { expires: number; artists: DiscoveredArtist[] } | null = null;
let pending: Promise<DiscoveredArtist[]> | null = null;

/** Descobre artistas pelos nomes dos MP3s nas pastas de música eletrônica.
 * A varredura é limitada e cacheada para não sobrecarregar o Google Drive.
 */
async function scanElectronicArtists(): Promise<DiscoveredArtist[]> {
  const targets = (await collectVipStyleTargets())
    .filter((target) => ELECTRONIC_STYLE.test(target.name))
    .slice(0, MAX_STYLE_FOLDERS);
  const found = new Map<string, DiscoveredArtist>();

  await mapPool(targets, 4, async (style) => {
    const consider = (files: Awaited<ReturnType<typeof listDriveFolderChildren>>) => {
      for (const file of files.filter(isDriveAudioFile).slice(0, MAX_FILES_PER_STYLE)) {
        const meta = parseTrackMeta(file.name);
        const display = getTrackDisplayMetadata({ fileName: file.name, ...meta });
        if (!display.artist || display.artist === UNKNOWN_ARTIST_LABEL) continue;
        for (const name of splitArtistCredits(display.artist)) {
          const slug = slugifyFolderName(name);
          if (!slug || slug.length < 3 || found.size >= MAX_ARTISTS) continue;
          const known = findKnownArtistBySlug(slug);
          const canonicalSlug = known?.slug ?? slug;
          if (found.has(canonicalSlug)) continue;
          found.set(canonicalSlug, {
            slug: canonicalSlug,
            name: known?.name ?? name,
            imageUrl: known?.imageUrl ?? null,
            shortBio: known?.shortBio ?? null,
            bio: null,
            genres: known?.genres?.length ? known.genres : [style.name],
            href: artistsHref(canonicalSlug),
            known: Boolean(known),
            source: "drive",
          });
        }
      }
    };
    try {
      const children = await listDriveFolderChildren(style.id);
      consider(children);
      const subfolders = children.filter((file) => file.mimeType === FOLDER_MIME).slice(0, 5);
      await mapPool(subfolders, 2, async (folder) => {
        try { consider(await listDriveFolderChildren(folder.id)); }
        catch { /* Pasta temporariamente inacessível. */ }
      });
    } catch { /* Mantém os artistas encontrados nas outras pastas. */ }
  });
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function listElectronicArtistsFromDrive(): Promise<DiscoveredArtist[]> {
  if (cached && cached.expires > Date.now()) return cached.artists;
  if (!pending) {
    pending = scanElectronicArtists()
      .then((artists) => {
        cached = { artists, expires: Date.now() + CACHE_MS };
        return artists;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}
