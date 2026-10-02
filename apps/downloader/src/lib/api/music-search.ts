import { apiFetch } from "./client";
import { resolveApiBaseUrl } from "./config";

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
  if (!coverUrl?.trim()) return null;
  if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) return coverUrl;
  if (coverUrl.startsWith("/")) return `${apiBaseUrl}${coverUrl}`;
  return `${apiBaseUrl}/${coverUrl}`;
}

export function formatTrackDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
