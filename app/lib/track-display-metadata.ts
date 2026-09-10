/**
 * Metadados de exibição de faixas (somente UI).
 * Não altera arquivos, Drive nem valores persistidos.
 */

export const UNKNOWN_ARTIST_LABEL = "Artista desconhecido";

const AUDIO_EXTENSION_RE = /\.(mp3|wav|flac|m4a|aac)$/i;

export type TrackDisplayInput = {
  title?: string | null;
  artist?: string | null;
  fileName?: string | null;
};

export type TrackDisplayMetadata = {
  title: string;
  artist: string;
};

export function stripAudioExtensionForDisplay(name: string): string {
  return name.replace(AUDIO_EXTENSION_RE, "").trim();
}

/** Nomes com _, códigos, datas ou separadores difíceis — não tentar adivinhar artista. */
export function isConfusingTrackName(name: string): boolean {
  const s = name.trim();
  if (!s) return true;
  if (/_{2,}/.test(s)) return true;
  if (/--/.test(s)) return true;
  if ((s.match(/_/g) ?? []).length >= 3) return true;
  // Sequência de símbolos (exceto hífen simples / pontuação musical comum)
  if (/[^a-zA-Z0-9À-ÿ\s&'.,()!?/+-]{3,}/.test(s)) return true;
  return false;
}

function normalizeCompare(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Remove `Artista - ` do início do título quando bate com o artist (só apresentação). */
export function stripDuplicatedArtistPrefix(title: string, artist: string): string | null {
  const a = artist.trim();
  const t = title.trim();
  if (!a || !t) return null;

  if (normalizeCompare(t.slice(0, a.length)) !== normalizeCompare(a)) return null;
  if (t.slice(a.length, a.length + 3) !== " - ") return null;

  const rest = t.slice(a.length + 3).trim();
  return rest || null;
}

function hasCleanStructuredMeta(title: string, artist: string): boolean {
  if (!title.trim() || !artist.trim()) return false;
  if (stripDuplicatedArtistPrefix(title, artist)) return false;
  if (normalizeCompare(title) === normalizeCompare(artist)) return false;
  return true;
}

/**
 * Separa apenas no padrão confiável `" - "` (espaço-hífen-espaço).
 * Preserva hífens internos (ex.: AC-DC).
 */
export function safeSplitArtistTitle(raw: string): TrackDisplayMetadata | null {
  if (isConfusingTrackName(raw)) return null;

  const sep = " - ";
  const idx = raw.indexOf(sep);
  if (idx <= 0) return null;

  const artist = raw.slice(0, idx).trim();
  const title = raw.slice(idx + sep.length).trim();
  if (!artist || !title) return null;
  if (isConfusingTrackName(artist) || isConfusingTrackName(title)) return null;

  return { title, artist };
}

/**
 * Campos derivados para UI / Media Session.
 *
 * Prioridade:
 * 1. metadados estruturados (com remoção de prefixo duplicado);
 * 2. parser seguro do nome (`" - "`);
 * 3. nome original + "Artista desconhecido".
 */
export function getTrackDisplayMetadata(track: TrackDisplayInput): TrackDisplayMetadata {
  const artistField = (track.artist ?? "").trim();
  const titleField = stripAudioExtensionForDisplay((track.title ?? "").trim());
  const fileField = stripAudioExtensionForDisplay((track.fileName ?? "").trim());

  if (artistField && titleField) {
    const deduped = stripDuplicatedArtistPrefix(titleField, artistField);
    if (deduped) {
      return { title: deduped, artist: artistField };
    }
    if (hasCleanStructuredMeta(titleField, artistField)) {
      return { title: titleField, artist: artistField };
    }
  }

  const parseSource = titleField || fileField;
  if (!parseSource) {
    return { title: "Faixa", artist: artistField || UNKNOWN_ARTIST_LABEL };
  }

  if (isConfusingTrackName(parseSource)) {
    return { title: parseSource, artist: UNKNOWN_ARTIST_LABEL };
  }

  const parsed = safeSplitArtistTitle(parseSource);
  if (parsed) {
    return {
      title: parsed.title,
      artist: artistField || parsed.artist,
    };
  }

  return {
    title: parseSource,
    artist: artistField || UNKNOWN_ARTIST_LABEL,
  };
}
