import { folderHref, slugifyFolderName } from "./vip-music-slugs";

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

function slugFromPackPathname(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const match = normalized.match(/^\/musicas\/(?:atualizacoes|dl)\/(.+)$/i);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).replace(/^\/+|\/+$/g, "");
  } catch {
    return match[1].replace(/^\/+|\/+$/g, "");
  }
}

/** Extrai o slug de uma URL do acervo/Downloader ou de um path/slug cru. */
export function parsePackDownloadInput(input: string): { slug: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const q = url.searchParams.get("slug")?.trim();
    if (q) return { slug: q.replace(/^\/+|\/+$/g, "") };
    const slug = slugFromPackPathname(url.pathname);
    if (slug) return { slug };
  } catch {
    /* não é URL absoluta */
  }

  const relative = slugFromPackPathname(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  if (relative) return { slug: relative };

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/i.test(trimmed)) {
    return { slug: trimmed };
  }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(trimmed)) {
    return { slug: trimmed };
  }

  return null;
}
