import { apiFetch } from "./client";
import { resolveApiBaseUrl } from "./config";

export const DEFAULT_TRACK_COVER = "/images/brs-default-cover.png";

export type MusicSearchTrack = {
  trackId: string;
  previewTrackId?: string;
  fileName: string;
  title: string;
  artist: string;
  version: string | null;
  genre: string | null;
  bpm: number | null;
  duration: number | null;
  year: number | null;
  coverUrl: string | null;
  relativePath: string;
  collectionLabel?: string | null;
  catalogPath?: string | null;
  provider: string;
  source: "vip" | "brs_production";
  previewAvailable: boolean;
  downloadAvailable: boolean;
};

export type MusicSearchResponse = {
  results: MusicSearchTrack[];
  total: number;
  query?: string;
  limit?: number;
  error?: string;
};

export async function searchMusicCatalog(token: string, query: string, limit = 24) {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(limit),
  });
  return apiFetch<MusicSearchResponse>(`/api/downloader/search?${params}`, {
    method: "GET",
    token,
  });
}

export async function buildAuthorizedStreamUrl(trackId: string, accessToken: string) {
  const base = await resolveApiBaseUrl();
  const params = new URLSearchParams({ access_token: accessToken });
  return `${base}/api/downloader/stream/${encodeURIComponent(trackId)}?${params}`;
}

export function resolveCoverUrl(coverUrl: string | null | undefined, apiBaseUrl: string) {
  const value = coverUrl?.trim() || DEFAULT_TRACK_COVER;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${apiBaseUrl}${value}`;
  return `${apiBaseUrl}/${value}`;
}

export function resolveCatalogUrl(catalogPath: string | null | undefined, apiBaseUrl: string) {
  if (!catalogPath?.trim()) return null;
  if (catalogPath.startsWith("http://") || catalogPath.startsWith("https://")) return catalogPath;
  if (catalogPath.startsWith("/")) return `${apiBaseUrl}${catalogPath}`;
  return `${apiBaseUrl}/${catalogPath}`;
}

export function formatTrackDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
