"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { folderHref } from "../../lib/vip-music-slugs";
import type { VipMusicSearchHit } from "../../lib/vip-music-search";

type AtualizacoesSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
  clearQuery: () => void;
  results: VipMusicSearchHit[];
  loading: boolean;
  error: string | null;
  isActive: boolean;
  navigateToHit: (hit: VipMusicSearchHit) => void;
  hitsForMonth: (monthSlug: string) => VipMusicSearchHit[];
  monthSlugsFromResults: Set<string>;
};

const AtualizacoesSearchContext = createContext<AtualizacoesSearchContextValue | null>(null);

export function hitHref(hit: VipMusicSearchHit, query?: string) {
  const segments = [hit.monthSlug];
  if (hit.weekSlug) segments.push(hit.weekSlug);
  const base = folderHref(segments);
  const params = new URLSearchParams();
  if (hit.styleSlug) params.set("estilo", hit.styleSlug);
  if (hit.type === "track") params.set("faixa", hit.id);
  if (query?.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function AtualizacoesSearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQueryState] = useState(urlQuery);
  const [results, setResults] = useState<VipMusicSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQueryState(urlQuery);
  }, [urlQuery]);

  const syncUrl = useCallback(
    (nextQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = nextQuery.trim();
      if (trimmed.length >= 2) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
        params.delete("estilo");
        params.delete("faixa");
      }
      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(next, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      syncUrl(value);
    },
    [syncUrl],
  );

  const clearQuery = useCallback(() => {
    setQueryState("");
    setResults([]);
    setError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("estilo");
    params.delete("faixa");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      void fetch(`/api/musicas/search?q=${encodeURIComponent(q)}`, { cache: "no-store" })
        .then(async (res) => {
          const data = (await res.json()) as { results?: VipMusicSearchHit[]; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Busca indisponível.");
          setResults(data.results ?? []);
        })
        .catch((err: Error) => {
          setError(err.message);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateToHit = useCallback(
    (hit: VipMusicSearchHit) => {
      const href = hitHref(hit, query);
      router.push(href, { scroll: true });
    },
    [query, router],
  );

  const hitsForMonth = useCallback(
    (monthSlug: string) => results.filter((hit) => hit.monthSlug === monthSlug),
    [results],
  );

  const monthSlugsFromResults = useMemo(() => {
    const slugs = new Set<string>();
    for (const hit of results) slugs.add(hit.monthSlug);
    return slugs;
  }, [results]);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      clearQuery,
      results,
      loading,
      error,
      isActive: query.trim().length >= 2,
      navigateToHit,
      hitsForMonth,
      monthSlugsFromResults,
    }),
    [query, setQuery, clearQuery, results, loading, error, navigateToHit, hitsForMonth, monthSlugsFromResults],
  );

  return <AtualizacoesSearchContext.Provider value={value}>{children}</AtualizacoesSearchContext.Provider>;
}

export function useAtualizacoesSearch() {
  const ctx = useContext(AtualizacoesSearchContext);
  if (!ctx) throw new Error("useAtualizacoesSearch must be used within AtualizacoesSearchProvider");
  return ctx;
}
