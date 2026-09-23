"use client";

import type { PreviewTrack } from "../../lib/google-drive";

const FAVORITES_KEY = "bp_music_favorites";
const CONTINUE_KEY = "bp_music_continue";
const RECENT_FOLDERS_KEY = "bp_music_recent_folders";
const LAST_VISIT_KEY = "bp_music_last_visit";
const FAVORITES_EVENT = "musicas:favorites-changed";
const FAVORITES_MAX = 40;

export type FavoriteTrack = {
  id: string;
  title: string;
  artist: string;
  href: string;
  styleName?: string;
  monthName?: string;
  addedAt: string;
};

export type ContinueListening = {
  trackId: string;
  title: string;
  artist: string;
  styleName: string;
  monthName: string;
  href: string;
  folderId: string;
  updatedAt: string;
};

export type RecentFolder = {
  name: string;
  href: string;
  visitedAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFavoriteTracks(): FavoriteTrack[] {
  const raw = readJson<unknown[]>(FAVORITES_KEY, []);
  return raw.filter(
    (item): item is FavoriteTrack =>
      Boolean(item) && typeof item === "object" && typeof (item as FavoriteTrack).id === "string",
  );
}

export function isFavoriteTrack(trackId: string) {
  return getFavoriteTracks().some((item) => item.id === trackId);
}

export function toggleFavoriteTrack(track: Omit<FavoriteTrack, "addedAt">) {
  const current = getFavoriteTracks();
  const exists = current.some((item) => item.id === track.id);
  const next = exists
    ? current.filter((item) => item.id !== track.id)
    : [{ ...track, addedAt: new Date().toISOString() }, ...current].slice(0, FAVORITES_MAX);
  writeJson(FAVORITES_KEY, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  }
  return next;
}

/** Notifica quando os favoritos mudam em qualquer parte da UI (mesma aba). */
export function subscribeFavoriteTracks(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FAVORITES_EVENT, callback);
  return () => window.removeEventListener(FAVORITES_EVENT, callback);
}

export function getContinueListening(): ContinueListening | null {
  return readJson<ContinueListening | null>(CONTINUE_KEY, null);
}

export function setContinueListening(data: ContinueListening) {
  writeJson(CONTINUE_KEY, data);
}

export function recordContinueFromTrack(
  track: PreviewTrack & { href: string; styleName: string; monthName: string; styleFolderId: string },
) {
  setContinueListening({
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    styleName: track.styleName,
    monthName: track.monthName,
    href: track.href,
    folderId: track.styleFolderId,
    updatedAt: new Date().toISOString(),
  });
}

export function getRecentFolders(): RecentFolder[] {
  return readJson<RecentFolder[]>(RECENT_FOLDERS_KEY, []).slice(0, 8);
}

export function pushRecentFolder(folder: Omit<RecentFolder, "visitedAt">) {
  const next = [
    { ...folder, visitedAt: new Date().toISOString() },
    ...getRecentFolders().filter((item) => item.href !== folder.href),
  ].slice(0, 8);
  writeJson(RECENT_FOLDERS_KEY, next);
  return next;
}

export function getLastVisit(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_VISIT_KEY);
}

export function touchLastVisit() {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
}

export function getUnseenNewCount(estimateFromApi: number) {
  const last = getLastVisit();
  if (!last) return estimateFromApi;
  const hoursSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60);
  if (hoursSince < 24) return Math.max(3, Math.round(estimateFromApi * 0.15));
  if (hoursSince < 72) return Math.max(8, Math.round(estimateFromApi * 0.35));
  return estimateFromApi;
}
