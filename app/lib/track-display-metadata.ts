/**
 * Metadados de exibição de faixas (somente UI).
 * Não altera arquivos, Drive nem valores persistidos.
 */

export const UNKNOWN_ARTIST_LABEL = "Artista desconhecido";

const AUDIO_EXTENSION_RE = /\.(mp3|wav|flac|m4a|aac)$/i;

/** Sufixo de versão comum em pools DJ: (Original Mix), (Extended Version), etc. */
const MIX_PAREN_RE =
  /\s*(\(([^)]*(?:Mix|Edit|Version|Remix|Extended|Original|Radio|Club|Dub|Instrumental|Clean|Dirty)[^)]*)\))\s*$/i;

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
  if (/[^a-zA-Z0-9À-ÿ\s&'.,()!?/+-]{3,}/.test(s)) return true;
  return false;
}

function normalizeCompare(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasFeatToken(value: string) {
  return /\b(feat\.?|ft\.?)\b/i.test(value);
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
  if (title.includes(" - ")) return false;
  if (stripDuplicatedArtistPrefix(title, artist)) return false;
  if (normalizeCompare(title) === normalizeCompare(artist)) return false;
  return true;
}

/**
 * Separa no padrão confiável `" - "` (espaço-hífen-espaço).
 *
 * Dois formatos comuns em pools:
 * - Artista - Música (versão)
 * - Música - Artista (versão)  ← comum em atualizações BR
 */
export function safeSplitArtistTitle(raw: string): TrackDisplayMetadata | null {
  if (isConfusingTrackName(raw)) return null;

  const sep = " - ";
  const idx = raw.indexOf(sep);
  if (idx <= 0) return null;

  const left = raw.slice(0, idx).trim();
  const right = raw.slice(idx + sep.length).trim();
  if (!left || !right) return null;
  if (isConfusingTrackName(left) || isConfusingTrackName(right)) return null;

  const rightMix = right.match(MIX_PAREN_RE);
  const leftHasFeat = hasFeatToken(left);
  const leftHasComma = left.includes(",");
  const rightHasComma = right.includes(",");

  // Título - Artista(s) (Mix): ex. "All Night Long - Volkoder (Original Mix)"
  // Não inverter bandas com vírgula à esquerda (Earth, Wind & Fire - September).
  if (rightMix && !leftHasFeat && !leftHasComma) {
    const artistCore = right.slice(0, rightMix.index).trim();
    const version = rightMix[1];
    const artistWords = wordCount(artistCore);

    if (artistCore && (rightHasComma || artistWords <= 2)) {
      return {
        title: `${left} ${version}`.replace(/\s+/g, " ").trim(),
        artist: artistCore,
      };
    }
  }

  // Padrão clássico: Artista - Música
  return { title: right, artist: left };
}

/**
 * Campos derivados para UI / Media Session.
 *
 * Prioridade:
 * 1. metadados estruturados limpos (ex.: tags ID3 já separadas);
 * 2. parser seguro do nome completo (`" - "`, inclusive Title - Artist);
 * 3. remoção de prefixo duplicado;
 * 4. nome original + "Artista desconhecido".
 */
export function getTrackDisplayMetadata(track: TrackDisplayInput): TrackDisplayMetadata {
  const artistField = (track.artist ?? "").trim();
  const titleField = stripAudioExtensionForDisplay((track.title ?? "").trim());
  const fileField = stripAudioExtensionForDisplay((track.fileName ?? "").trim());
  const parseSource = titleField || fileField;

  // 1) Tags / meta já separados (título sem " - ")
  if (artistField && titleField && hasCleanStructuredMeta(titleField, artistField)) {
    return { title: titleField, artist: artistField };
  }

  if (!parseSource) {
    return { title: "Faixa", artist: artistField || UNKNOWN_ARTIST_LABEL };
  }

  if (isConfusingTrackName(parseSource)) {
    return { title: parseSource, artist: UNKNOWN_ARTIST_LABEL };
  }

  // 2) Parser seguro do nome completo (corrige artist errado do parseTrackMeta)
  if (parseSource.includes(" - ")) {
    const parsed = safeSplitArtistTitle(parseSource);
    if (parsed) return parsed;
  }

  // 3) Dedupe legado: title ainda traz "Artista - Música"
  if (artistField && titleField) {
    const deduped = stripDuplicatedArtistPrefix(titleField, artistField);
    if (deduped) {
      return { title: deduped, artist: artistField };
    }
  }

  return {
    title: parseSource,
    artist: artistField || UNKNOWN_ARTIST_LABEL,
  };
}
