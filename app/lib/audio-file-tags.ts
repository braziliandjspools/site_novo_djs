import { parseBuffer } from "music-metadata";
import { GOOGLE_DRIVE_API_KEY } from "./site";
import type { PreviewTrack } from "./google-drive";
import { getAudioSourceUrl } from "./google-drive";

/** Bytes iniciais — ID3v2 + capa embutida comum cabem aqui. */
const TAG_HEAD_BYTES = 1024 * 1024;
const ENRICH_CONCURRENCY = 4;
const CACHE_TTL_MS = 60 * 60 * 1000;

export type DriveAudioTags = {
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  hasCover: boolean;
};

export type DriveAudioCover = {
  data: Buffer;
  contentType: string;
};

type CacheEntry = {
  tags: DriveAudioTags | null;
  cover: DriveAudioCover | null;
  expiresAt: number;
};

const metaCache = new Map<string, CacheEntry>();

function cacheKey(fileId: string, modifiedAt?: string | null) {
  return `${fileId}:${modifiedAt ?? ""}`;
}

function cleanTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\0/g, "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function contentTypeFromPicture(format?: string): string {
  const raw = (format ?? "").toLowerCase().trim();
  if (!raw) return "image/jpeg";
  if (raw.startsWith("image/")) return raw;
  if (raw === "png" || raw === "image/png") return "image/png";
  if (raw === "webp") return "image/webp";
  if (raw === "gif") return "image/gif";
  if (raw === "bmp") return "image/bmp";
  return "image/jpeg";
}

function pickCover(pictures: Array<{ data?: Uint8Array | Buffer; format?: string }> | undefined): DriveAudioCover | null {
  if (!pictures?.length) return null;
  const preferred =
    pictures.find((pic) => {
      const format = (pic.format ?? "").toLowerCase();
      return format.includes("jpeg") || format.includes("jpg") || format.includes("png");
    }) ?? pictures[0];
  if (!preferred?.data || preferred.data.byteLength < 32) return null;
  return {
    data: Buffer.from(preferred.data),
    contentType: contentTypeFromPicture(preferred.format),
  };
}

function tagCoverUrl(fileId: string, modifiedAt?: string | null) {
  const base = `/api/musicas/tag-cover/${encodeURIComponent(fileId)}`;
  if (!modifiedAt) return base;
  return `${base}?m=${encodeURIComponent(modifiedAt)}`;
}

async function loadDriveAudioMeta(
  fileId: string,
  modifiedAt?: string | null,
): Promise<CacheEntry> {
  const key = cacheKey(fileId, modifiedAt);
  const cached = metaCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const miss: CacheEntry = {
    tags: null,
    cover: null,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  if (!GOOGLE_DRIVE_API_KEY) {
    metaCache.set(key, miss);
    return miss;
  }

  try {
    const url = getAudioSourceUrl(fileId);
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${TAG_HEAD_BYTES - 1}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok && res.status !== 206) {
      const short: CacheEntry = { ...miss, expiresAt: Date.now() + 5 * 60 * 1000 };
      metaCache.set(key, short);
      return short;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 32) {
      metaCache.set(key, miss);
      return miss;
    }

    const metadata = await parseBuffer(buffer, undefined, {
      duration: false,
      skipCovers: false,
      skipPostHeaders: true,
    });

    const artists = (metadata.common.artists ?? [])
      .map((item) => cleanTag(item))
      .filter((item): item is string => Boolean(item));
    const artistFromList =
      artists.length === 0
        ? null
        : artists.length === 1
          ? artists[0]!
          : `${artists[0]} feat. ${artists.slice(1).join(", ")}`;

    const cover = pickCover(metadata.common.picture);
    const tags: DriveAudioTags = {
      title: cleanTag(metadata.common.title),
      artist: artistFromList || cleanTag(metadata.common.artist),
      album: cleanTag(metadata.common.album),
      albumArtist: cleanTag(metadata.common.albumartist),
      hasCover: Boolean(cover),
    };

    const empty = !tags.title && !tags.artist && !tags.album && !tags.albumArtist && !tags.hasCover;
    const entry: CacheEntry = {
      tags: empty ? null : tags,
      cover,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    metaCache.set(key, entry);
    return entry;
  } catch {
    const short: CacheEntry = { ...miss, expiresAt: Date.now() + 5 * 60 * 1000 };
    metaCache.set(key, short);
    return short;
  }
}

/**
 * Baixa o início do arquivo no Drive e extrai tags (artista, álbum, título, capa).
 * Falha silenciosa — o player/lista continuam com o parse do nome do arquivo.
 */
export async function readDriveAudioTags(
  fileId: string,
  modifiedAt?: string | null,
): Promise<DriveAudioTags | null> {
  const entry = await loadDriveAudioMeta(fileId, modifiedAt);
  return entry.tags;
}

/** Capa embutida na tag (APIC / PICTURE), se existir no prefixo lido do arquivo. */
export async function readDriveAudioCover(
  fileId: string,
  modifiedAt?: string | null,
): Promise<DriveAudioCover | null> {
  const entry = await loadDriveAudioMeta(fileId, modifiedAt);
  return entry.cover;
}

/**
 * Mescla tags do arquivo com o meta do nome.
 * - Artista da tag preenche quando o nome não tem artista.
 * - Álbum da tag entra em `album` (Media Session / UI).
 * - Capa da tag vira `coverUrl` (API); senão fica o fallback do player.
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
  let coverUrl = track.coverUrl?.trim() || null;

  if (!artist) {
    artist = (tags.artist || tags.albumArtist || "").trim();
  }

  if (!album && tags.album) {
    album = tags.album;
  }

  if (!title && tags.title) {
    title = tags.title;
  }

  if (!coverUrl && tags.hasCover) {
    coverUrl = tagCoverUrl(track.id, track.modifiedAt);
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
    coverUrl,
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
