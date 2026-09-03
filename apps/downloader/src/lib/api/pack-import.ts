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
};

export type PackImportResult = {
  ok: true;
  count: number;
  trackCount: number;
  folderName: string;
  relativePath: string;
  slug: string;
};

export function parsePackLinkInput(input: string): { slug: string } | null {
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
    /* raw */
  }

  const relative = fromPath(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  if (relative) return { slug: relative };

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/i.test(trimmed)) {
    return { slug: trimmed };
  }

  return null;
}

export async function previewPackLink(token: string, urlOrSlug: string) {
  const parsed = parsePackLinkInput(urlOrSlug);
  const slug = parsed?.slug ?? urlOrSlug.trim();
  const params = new URLSearchParams({ slug });
  return apiFetch<PackPreview>(`/api/downloader/pack/preview?${params.toString()}`, {
    method: "GET",
    token,
  });
}

export async function importPackLink(token: string, urlOrSlug: string) {
  const parsed = parsePackLinkInput(urlOrSlug);
  const slug = parsed?.slug ?? urlOrSlug.trim();
  return apiFetch<PackImportResult>("/api/downloader/pack/import", {
    method: "POST",
    token,
    body: JSON.stringify({ slug }),
  });
}
