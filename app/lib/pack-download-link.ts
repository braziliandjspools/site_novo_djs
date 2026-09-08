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

export type ParsedPackLink = {
  slug: string;
  root: "vip" | "colecoes";
};

function slugFromPackPathname(pathname: string): ParsedPackLink | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const match = normalized.match(/^\/musicas\/(atualizacoes|dl|colecoes)\/(.+)$/i);
  if (!match?.[2]) return null;
  const section = match[1].toLowerCase();
  const root = section === "colecoes" ? "colecoes" : "vip";
  try {
    return {
      slug: decodeURIComponent(match[2]).replace(/^\/+|\/+$/g, ""),
      root,
    };
  } catch {
    return {
      slug: match[2].replace(/^\/+|\/+$/g, ""),
      root,
    };
  }
}

/** Extrai o slug de uma URL do acervo/Downloader ou de um path/slug cru. */
export function parsePackDownloadInput(input: string): ParsedPackLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const q = url.searchParams.get("slug")?.trim();
    const rootParam = url.searchParams.get("root")?.trim().toLowerCase();
    if (q) {
      return {
        slug: q.replace(/^\/+|\/+$/g, ""),
        root: rootParam === "colecoes" ? "colecoes" : "vip",
      };
    }
    const fromPath = slugFromPackPathname(url.pathname);
    if (fromPath) return fromPath;
  } catch {
    /* não é URL absoluta */
  }

  const relative = slugFromPackPathname(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  if (relative) return relative;

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/i.test(trimmed)) {
    return { slug: trimmed, root: "vip" };
  }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(trimmed)) {
    return { slug: trimmed, root: "vip" };
  }

  return null;
}
