import { apiFetch } from "./client";

export type PackPreview = {
  ok: true;
  slug: string;
  folderId: string;
  folderName: string;
  relativePath: string;
  pathLabels: string[];
  trackCount: number;
  sampleTitles: string[];
  downloadUrl: string;
  root?: "vip" | "colecoes";
};

export type PackImportResult = {
  ok: true;
  count: number;
  trackCount: number;
  folderName: string;
  relativePath: string;
  slug: string;
  root?: "vip" | "colecoes";
};

export type ParsedPackLink = {
  slug: string;
  root: "vip" | "colecoes";
};

const FORCE_FOLDER_TREE_PREFIX = "__BRS_TREE__/";

export function stripForcedFolderTreePrefix(relativePath: string | null | undefined): string {
  if (!relativePath?.trim()) return "";
  const trimmed = relativePath.trim();
  if (trimmed.startsWith(FORCE_FOLDER_TREE_PREFIX)) {
    return trimmed.slice(FORCE_FOLDER_TREE_PREFIX.length);
  }
  return trimmed;
}

export function parsePackLinkInput(input: string): ParsedPackLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromPath = (pathname: string): ParsedPackLink | null => {
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const match = normalized.match(/^\/musicas\/(atualizacoes|dl|colecoes)\/(.+)$/i);
    if (!match?.[2]) return null;
    const section = match[1].toLowerCase();
    const root = section === "colecoes" ? "colecoes" : "vip";
    try {
      return { slug: decodeURIComponent(match[2]).replace(/^\/+|\/+$/g, ""), root };
    } catch {
      return { slug: match[2].replace(/^\/+|\/+$/g, ""), root };
    }
  };

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
    const slug = fromPath(url.pathname);
    if (slug) return slug;
  } catch {
    /* raw */
  }

  const relative = fromPath(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  if (relative) return relative;

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/i.test(trimmed)) {
    return { slug: trimmed, root: "vip" };
  }

  return null;
}

export async function previewPackLink(token: string, urlOrSlug: string) {
  const parsed = parsePackLinkInput(urlOrSlug);
  const slug = parsed?.slug ?? urlOrSlug.trim();
  const params = new URLSearchParams({ slug });
  if (parsed?.root === "colecoes") params.set("root", "colecoes");
  return apiFetch<PackPreview>(`/api/downloader/pack/preview?${params.toString()}`, {
    method: "GET",
    token,
  });
}

export async function importPackLink(
  token: string,
  urlOrSlug: string,
  options?: { root?: "vip" | "colecoes" },
) {
  const parsed = parsePackLinkInput(urlOrSlug);
  const slug = parsed?.slug ?? urlOrSlug.trim();
  const root = options?.root ?? parsed?.root ?? "vip";
  return apiFetch<PackImportResult>("/api/downloader/pack/import", {
    method: "POST",
    token,
    body: JSON.stringify({ slug, root }),
  });
}
