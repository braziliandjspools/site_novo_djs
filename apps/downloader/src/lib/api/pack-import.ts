import { apiFetch } from "./client";

export type PackPreview = {
  ok: true;
  kind?: "pack" | "artist";
  slug: string;
  folderId: string;
  folderName: string;
  relativePath: string;
  pathLabels: string[];
  trackCount: number;
  sampleTitles: string[];
  downloadUrl: string;
  root?: "vip" | "colecoes";
  hasSubfolders?: boolean;
  trackCountIsEstimate?: boolean;
  subfolderCount?: number;
};

export type PackImportResult = {
  ok: true;
  kind?: "pack" | "artist";
  count: number;
  trackCount: number;
  folderName: string;
  relativePath: string;
  slug: string;
  root?: "vip" | "colecoes";
};

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

const FORCE_FOLDER_TREE_PREFIX = "__BRS_TREE__/";

export function stripForcedFolderTreePrefix(relativePath: string | null | undefined): string {
  if (!relativePath?.trim()) return "";
  const trimmed = relativePath.trim();
  if (trimmed.startsWith(FORCE_FOLDER_TREE_PREFIX)) {
    return trimmed.slice(FORCE_FOLDER_TREE_PREFIX.length);
  }
  return trimmed;
}

function slugifySimple(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanInput(input: string): string {
  return input
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function resolvePathname(input: string): string | null {
  const trimmed = cleanInput(input);
  if (!trimmed) return null;

  const candidates = [trimmed];
  if (!/^https?:\/\//i.test(trimmed)) {
    candidates.push(`http://${trimmed.replace(/^\/\//, "")}`);
  }

  for (const candidate of candidates) {
    try {
      return new URL(candidate).pathname;
    } catch {
      /* next */
    }
  }

  if (trimmed.startsWith("/")) {
    return trimmed.split(/[?#]/)[0] || "/";
  }

  const musicasIdx = trimmed.search(/\/musicas\//i);
  if (musicasIdx >= 0) {
    return trimmed.slice(musicasIdx).split(/[?#]/)[0] || null;
  }

  return null;
}

function fromArtistPath(pathname: string): ParsedArtistLink | null {
  const normalized = pathname.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  const match = normalized.match(/^\/musicas\/artistas\/([^/]+)$/i);
  if (!match?.[1]) return null;
  try {
    const slug = slugifySimple(decodeURIComponent(match[1]));
    return slug ? { kind: "artist", slug } : null;
  } catch {
    const slug = slugifySimple(match[1]);
    return slug ? { kind: "artist", slug } : null;
  }
}

function fromPackPath(pathname: string): ParsedPackLink | null {
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
    return { kind: "pack", slug: match[2].replace(/^\/+|\/+$/g, ""), root };
  }
}

/** Extrai pasta ou artista de URL/path/slug do acervo VIP. */
export function parsePackLinkInput(input: string): ParsedDownloadLink | null {
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
        const artistSlug = slugifySimple(slug);
        return artistSlug ? { kind: "artist", slug: artistSlug } : null;
      }
      return {
        kind: "pack",
        slug,
        root: rootParam === "colecoes" ? "colecoes" : "vip",
      };
    }
    const artist = fromArtistPath(url.pathname);
    if (artist) return artist;
    const pack = fromPackPath(url.pathname);
    if (pack) return pack;
  } catch {
    /* raw / relative */
  }

  const pathname = resolvePathname(trimmed);
  if (pathname) {
    const artist = fromArtistPath(pathname);
    if (artist) return artist;
    const pack = fromPackPath(pathname);
    if (pack) return pack;
  }

  // Fallback: captura `/musicas/artistas/slug` em qualquer trecho colado
  const artistEmbed = trimmed.match(/\/musicas\/artistas\/([^/?#\s]+)/i);
  if (artistEmbed?.[1]) {
    try {
      const slug = slugifySimple(decodeURIComponent(artistEmbed[1]));
      if (slug) return { kind: "artist", slug };
    } catch {
      const slug = slugifySimple(artistEmbed[1]);
      if (slug) return { kind: "artist", slug };
    }
  }

  const packEmbed = trimmed.match(/\/musicas\/(atualizacoes|dl|colecoes)\/([^\s?#]+)/i);
  if (packEmbed?.[2]) {
    const root = packEmbed[1].toLowerCase() === "colecoes" ? "colecoes" : "vip";
    try {
      return {
        kind: "pack",
        slug: decodeURIComponent(packEmbed[2]).replace(/^\/+|\/+$/g, ""),
        root,
      };
    } catch {
      return {
        kind: "pack",
        slug: packEmbed[2].replace(/^\/+|\/+$/g, ""),
        root,
      };
    }
  }

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/i.test(trimmed)) {
    return { kind: "pack", slug: trimmed, root: "vip" };
  }

  return null;
}

export async function previewPackLink(token: string, urlOrSlug: string) {
  const parsed = parsePackLinkInput(urlOrSlug);
  const slug = parsed?.slug ?? urlOrSlug.trim();
  const params = new URLSearchParams({ slug });
  if (parsed?.kind === "artist") {
    params.set("kind", "artist");
  } else if (parsed?.kind === "pack" && parsed.root === "colecoes") {
    params.set("root", "colecoes");
  }
  // Ajuda o backend a reparsear a URL original (ex.: localhost)
  if (/^https?:\/\//i.test(urlOrSlug.trim()) || urlOrSlug.includes("/musicas/")) {
    params.set("url", urlOrSlug.trim());
  }
  return apiFetch<PackPreview>(`/api/downloader/pack/preview?${params.toString()}`, {
    method: "GET",
    token,
  });
}

export async function importPackLink(
  token: string,
  urlOrSlug: string,
  options?: { root?: "vip" | "colecoes"; kind?: "pack" | "artist" },
) {
  const parsed = parsePackLinkInput(urlOrSlug);
  const slug = parsed?.slug ?? urlOrSlug.trim();
  const kind = options?.kind ?? parsed?.kind ?? "pack";
  const root =
    options?.root ?? (parsed?.kind === "pack" ? parsed.root : undefined) ?? "vip";
  return apiFetch<PackImportResult>("/api/downloader/pack/import", {
    method: "POST",
    token,
    body: JSON.stringify({ slug, root, kind, url: urlOrSlug.trim() }),
  });
}
