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

  let res: Response | null = null;
  // 502/503 podem vir do proxy antes de o Route Handler conseguir responder.
  // Em vez de quebrar o infinite scroll imediatamente, tenta novamente duas vezes.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      res = await fetch(url, {
        cache: options.forceRefresh ? "no-store" : "default",
      });
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      continue;
    }

    if (res.status !== 502 && res.status !== 503) break;
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
    }
  }

  if (!res) {
    throw new Error("A API não respondeu.");
  }

  const contentType = res.headers.get("content-type") ?? "";
  let body: T & { error?: string };
  if (contentType.includes("application/json")) {
    body = (await res.json()) as T & { error?: string };
  } else {
    const text = await res.text();
    const status = res.status ? `Erro ${res.status}` : "Resposta inválida";
    throw new Error(
      res.ok
        ? `${status}: a API retornou conteúdo não-JSON.`
        : `${status}: a API retornou uma página HTML em vez de JSON.`,
    );
  }
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
