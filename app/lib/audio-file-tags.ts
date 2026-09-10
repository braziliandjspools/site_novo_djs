import { parseBuffer } from "music-metadata";
import { GOOGLE_DRIVE_API_KEY } from "./site";
import type { PreviewTrack } from "./google-drive";
import { getAudioSourceUrl } from "./google-drive";

/** Bytes iniciais do arquivo — suficientes para ID3v2 / cabeçalhos comuns. */
const TAG_HEAD_BYTES = 512 * 1024;
const ENRICH_CONCURRENCY = 4;
const CACHE_TTL_MS = 60 * 60 * 1000;

export type DriveAudioTags = {
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
};

type CacheEntry = {
  tags: DriveAudioTags | null;
  expiresAt: number;
};

const tagCache = new Map<string, CacheEntry>();

function cacheKey(fileId: string, modifiedAt?: string | null) {
  return `${fileId}:${modifiedAt ?? ""}`;
}

function cleanTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\0/g, "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Baixa o início do arquivo no Drive e extrai tags (artista, álbum, título).
 * Falha silenciosa — o player/lista continuam com o parse do nome do arquivo.
 */
export async function readDriveAudioTags(
  fileId: string,
  modifiedAt?: string | null,
): Promise<DriveAudioTags | null> {
  const key = cacheKey(fileId, modifiedAt);
  const cached = tagCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.tags;

  if (!GOOGLE_DRIVE_API_KEY) {
    tagCache.set(key, { tags: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return null;
  }

  try {
    const url = getAudioSourceUrl(fileId);
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${TAG_HEAD_BYTES - 1}` },
      // Cache curto: tags mudam pouco; evita martelar a API em listagens.
      next: { revalidate: 3600 },
    });

    if (!res.ok && res.status !== 206) {
      tagCache.set(key, { tags: null, expiresAt: Date.now() + 5 * 60 * 1000 });
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 32) {
      tagCache.set(key, { tags: null, expiresAt: Date.now() + CACHE_TTL_MS });
      return null;
    }

    const metadata = await parseBuffer(buffer, undefined, {
      duration: false,
      skipCovers: true,
      skipPostHeaders: true,
    });

    const artists = (metadata.common.artists ?? [])
      .map((item) => cleanTag(item))
      .filter((item): item is string => Boolean(item));
    // Vários artistas na tag = principal + participantes (feat.).
    const artistFromList =
      artists.length === 0
        ? null
        : artists.length === 1
          ? artists[0]!
          : `${artists[0]} feat. ${artists.slice(1).join(", ")}`;

    const tags: DriveAudioTags = {
      title: cleanTag(metadata.common.title),
      artist: artistFromList || cleanTag(metadata.common.artist),
      album: cleanTag(metadata.common.album),
      albumArtist: cleanTag(metadata.common.albumartist),
    };

    const empty = !tags.title && !tags.artist && !tags.album && !tags.albumArtist;
    const result = empty ? null : tags;
    tagCache.set(key, { tags: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    tagCache.set(key, { tags: null, expiresAt: Date.now() + 5 * 60 * 1000 });
    return null;
  }
}

/**
 * Mescla tags do arquivo com o meta do nome.
 * - Artista da tag preenche quando o nome não tem artista.
 * - Álbum da tag entra em `album` (Media Session / UI).
 * - Título da tag só entra se o título do arquivo estiver vazio.
 */
export function mergePreviewTrackWithTags(
  track: PreviewTrack,
  tags: DriveAudioTags | null,
): PreviewTrack {
  if (!tags) return track;

  let artist = (track.artist ?? "").trim();
  let title = (track.title ?? "").trim();
  let album = (track.album ?? "").trim() || null;

  if (!artist) {
    artist = (tags.artist || tags.albumArtist || "").trim();
  }

  if (!album && tags.album) {
    album = tags.album;
  }

  if (!title && tags.title) {
    title = tags.title;
  }

  // Se ganhamos artista via tag e o título ainda começa com "Artista - ", limpa o prefixo.
  if (artist && title.toLowerCase().startsWith(`${artist.toLowerCase()} - `)) {
    title = title.slice(artist.length + 3).trim() || title;
  }

  return {
    ...track,
    artist,
    title: title || track.title,
    album,
  };
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/** Enriquece uma página de faixas com tags do Drive (concorrência limitada + cache). */
export async function enrichTracksWithDriveTags(tracks: PreviewTrack[]): Promise<PreviewTrack[]> {
  if (tracks.length === 0) return tracks;

  return mapPool(tracks, ENRICH_CONCURRENCY, async (track) => {
    const tags = await readDriveAudioTags(track.id, track.modifiedAt);
    return mergePreviewTrackWithTags(track, tags);
  });
}
