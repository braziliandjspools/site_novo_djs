import { folderHref, slugifyArtistName, slugifyFolderName } from "./vip-music-slugs";

/** Path canônico do link de pasta (igual à URL do navegador no acervo). */
export const PACK_DOWNLOAD_PATH_PREFIX = "/musicas/atualizacoes";

/** Alias legado ainda aceito pelo Downloader. */
export const PACK_DOWNLOAD_LEGACY_PATH_PREFIX = "/musicas/dl";

export function buildPackDownloadPath(slugSegments: string[]): string {
  const clean = slugSegments
    .map((segment) => {
      const slug = slugifyFolderName(segment);
      return slug || segment.trim();
    })
    .filter(Boolean);
  return folderHref(clean);
}

export function buildPackDownloadUrl(slugSegments: string[], origin?: string): string {
  const path = buildPackDownloadPath(slugSegments);
  if (origin) return `${origin.replace(/\/+$/, "")}${path}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export type ParsedPackLink = {
  kind: "pack";
  slug: string;
  root: "vip" | "colecoes";
};

export type ParsedArtistLink = {
  kind: "artist";
  slug: string;
};

export type ParsedDownloadLink = ParsedPackLink | ParsedArtistLink;

function cleanInput(input: string): string {
  return input
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function slugFromArtistPathname(pathname: string): ParsedArtistLink | null {
  const normalized = pathname.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  const match = normalized.match(/^\/musicas\/artistas\/([^/]+)$/i);
  if (!match?.[1]) return null;
  try {
    const slug = slugifyArtistName(decodeURIComponent(match[1]));
    return slug ? { kind: "artist", slug } : null;
  } catch {
    const slug = slugifyArtistName(match[1]);
    return slug ? { kind: "artist", slug } : null;
  }
}

function slugFromPackPathname(pathname: string): ParsedPackLink | null {
  const normalized = pathname.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  const match = normalized.match(/^\/musicas\/(atualizacoes|dl|colecoes)\/(.+)$/i);
  if (!match?.[2]) return null;
  const section = match[1].toLowerCase();
  const root = section === "colecoes" ? "colecoes" : "vip";
  try {
    return {
      kind: "pack",
      slug: decodeURIComponent(match[2]).replace(/^\/+|\/+$/g, ""),
      root,
    };
  } catch {
    return {
      kind: "pack",
      slug: match[2].replace(/^\/+|\/+$/g, ""),
      root,
    };
  }
}

/** Extrai pasta ou artista de uma URL do acervo/Downloader ou de um path/slug cru. */
export function parsePackDownloadInput(input: string): ParsedDownloadLink | null {
  const trimmed = cleanInput(input);
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `http://${trimmed.replace(/^\/\//, "")}`;
    const url = new URL(withProtocol);
    const kindParam = url.searchParams.get("kind")?.trim().toLowerCase();
    const q = url.searchParams.get("slug")?.trim();
    const rootParam = url.searchParams.get("root")?.trim().toLowerCase();
    if (q) {
      const slug = q.replace(/^\/+|\/+$/g, "");
      if (kindParam === "artist") {
        const artistSlug = slugifyArtistName(slug);
        return artistSlug ? { kind: "artist", slug: artistSlug } : null;
      }
      return {
        kind: "pack",
        slug,
        root: rootParam === "colecoes" ? "colecoes" : "vip",
      };
    }
    const artist = slugFromArtistPathname(url.pathname);
    if (artist) return artist;
    const fromPath = slugFromPackPathname(url.pathname);
    if (fromPath) return fromPath;
  } catch {
    /* não é URL absoluta */
  }

  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const artistRelative = slugFromArtistPathname(withSlash.split(/[?#]/)[0] ?? withSlash);
  if (artistRelative) return artistRelative;
  const relative = slugFromPackPathname(withSlash.split(/[?#]/)[0] ?? withSlash);
  if (relative) return relative;

  const artistEmbed = trimmed.match(/\/musicas\/artistas\/([^/?#\s]+)/i);
  if (artistEmbed?.[1]) {
    try {
      const slug = slugifyArtistName(decodeURIComponent(artistEmbed[1]));
      if (slug) return { kind: "artist", slug };
    } catch {
      const slug = slugifyArtistName(artistEmbed[1]);
      if (slug) return { kind: "artist", slug };
    }
  }

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/i.test(trimmed)) {
    return { kind: "pack", slug: trimmed, root: "vip" };
  }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(trimmed)) {
    return { kind: "pack", slug: trimmed, root: "vip" };
  }

  return null;
}
