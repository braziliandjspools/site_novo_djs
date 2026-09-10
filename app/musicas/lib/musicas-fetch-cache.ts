"use client";

/** Cache em memória no client — evita refetch lento ao voltar/navegar no acervo. */
type CacheEntry = {
  expiresAt: number;
  body: unknown;
};

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 180_000;

export function peekMusicasCache<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.body as T;
}

export function setMusicasCache(key: string, body: unknown, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { body, expiresAt: Date.now() + ttlMs });
}

export function clearMusicasCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

type FetchOptions = {
  forceRefresh?: boolean;
  ttlMs?: number;
};

/** GET com cache local; `forceRefresh` ignora e limpa a entrada. */
export async function fetchMusicasJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const key = url;
  if (options.forceRefresh) {
    store.delete(key);
  } else {
    const cached = peekMusicasCache<T>(key);
    if (cached != null) return cached;
  }

  const res = await fetch(url, {
    cache: options.forceRefresh ? "no-store" : "default",
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
  }
  setMusicasCache(key, body, options.ttlMs);
  return body;
}

/** Prefetch em background (hover de links do acervo). */
export function prefetchMusicasJson(url: string) {
  if (peekMusicasCache(url)) return;
  void fetchMusicasJson(url).catch(() => {});
}
