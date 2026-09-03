import { slugifyFolderName } from "./vip-music-slugs";

export const PACK_DOWNLOAD_PATH_PREFIX = "/musicas/dl";

export function buildPackDownloadPath(slugSegments: string[]): string {
  const clean = slugSegments
    .map((segment) => {
      const slug = slugifyFolderName(segment);
      return slug || segment.trim();
    })
    .filter(Boolean);
  if (clean.length === 0) return PACK_DOWNLOAD_PATH_PREFIX;
  return `${PACK_DOWNLOAD_PATH_PREFIX}/${clean.join("/")}`;
}

export function buildPackDownloadUrl(slugSegments: string[], origin?: string): string {
  const path = buildPackDownloadPath(slugSegments);
  if (origin) return `${origin.replace(/\/+$/, "")}${path}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** Extrai o slug de uma URL do Downloader ou de um path/slug cru. */
export function parsePackDownloadInput(input: string): { slug: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromPath = (pathname: string) => {
    const match = pathname.match(/\/musicas\/dl\/(.+?)\/?$/i);
    if (!match?.[1]) return null;
    try {
      return decodeURIComponent(match[1]).replace(/^\/+|\/+$/g, "");
    } catch {
      return match[1].replace(/^\/+|\/+$/g, "");
    }
  };

  try {
    const url = new URL(trimmed);
    const q = url.searchParams.get("slug")?.trim();
    if (q) return { slug: q.replace(/^\/+|\/+$/g, "") };
    const slug = fromPath(url.pathname);
    if (slug) return { slug };
  } catch {
    /* não é URL absoluta */
  }

  const relative = fromPath(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  if (relative) return { slug: relative };

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/i.test(trimmed)) {
    return { slug: trimmed };
  }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(trimmed)) {
    return { slug: trimmed };
  }

  return null;
}
