"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { folderHref } from "../../lib/vip-music-slugs";
import type { VipMusicSearchHit } from "../../lib/vip-music-search";

type AtualizacoesSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
  submitSearch: () => void;
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
  if (hit.poolSlug) segments.push(hit.poolSlug);
  if (hit.styleSlug) segments.push(hit.styleSlug);
  const base = folderHref(segments);
  const params = new URLSearchParams();
  if (hit.type === "track") {
    params.set("faixa", hit.id);
    if (hit.page && hit.page > 1) params.set("page", String(hit.page));
  }
  if (query?.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

async function parseSearchResponse(res: Response): Promise<{
  results?: VipMusicSearchHit[];
  error?: string;
}> {
  const contentType = res.headers.get("content-type") ?? "";
  const raw = await res.text();

  if (!raw) {
    if (!res.ok) throw new Error("Busca indisponível.");
    return { results: [] };
  }

  if (!contentType.includes("application/json") && raw.trimStart().startsWith("<")) {
    throw new Error(
      res.status >= 500
        ? "Busca sobrecarregada. Tente de novo em instantes."
        : "Busca indisponível no momento.",
    );
  }

  try {
    return JSON.parse(raw) as { results?: VipMusicSearchHit[]; error?: string };
  } catch {
    throw new Error("Resposta inválida da busca.");
  }
}

export function AtualizacoesSearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("busca") ?? searchParams.get("q") ?? "";

  const [query, setQueryState] = useState(urlQuery);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<VipMusicSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const searchParamsRef = useRef(searchParams);
  const routerReadyRef = useRef(false);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    routerReadyRef.current = true;
  }, []);

  // A URL preenche o campo, mas nunca dispara uma busca sozinha.
  useEffect(() => {
    setQueryState((prev) => (prev === urlQuery ? prev : urlQuery));
  }, [urlQuery]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setSubmittedQuery("");
    setResults([]);
    setError(null);
  }, []);

  const clearQuery = useCallback(() => {
    abortRef.current?.abort();
    requestIdRef.current += 1;
    setQueryState("");
    setSubmittedQuery("");
    setResults([]);
    setError(null);
    setLoading(false);

    if (!routerReadyRef.current) return;
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.delete("busca");
    params.delete("q");
    params.delete("estilo");
    params.delete("faixa");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router]);

  const submitSearch = useCallback(() => {
    const q = query.trim();

    if (q.length < 2) {
      setSubmittedQuery("");
      setResults([]);
      setError("Digite pelo menos 2 caracteres para pesquisar.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setSubmittedQuery(q);
    setResults([]);
    setError(null);
    setLoading(true);

    if (routerReadyRef.current) {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      params.set("busca", q);
      params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }

    void fetch(`/api/musicas/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await parseSearchResponse(res);
        if (!res.ok) throw new Error(data.error ?? "Busca indisponível.");
        if (requestId !== requestIdRef.current) return;
        setResults(data.results ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;
        const message = err instanceof Error ? err.message : "Busca indisponível.";
        setError(message);
        setResults([]);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [pathname, query, router]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const navigateToHit = useCallback(
    (hit: VipMusicSearchHit) => {
      abortRef.current?.abort();
      requestIdRef.current += 1;
      setQueryState("");
      setSubmittedQuery("");
      setResults([]);
      setError(null);
      setLoading(false);
      if (!routerReadyRef.current) return;
      router.push(hitHref(hit), { scroll: true });
    },
    [router],
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
      submitSearch,
      clearQuery,
      results,
      loading,
      error,
      isActive: submittedQuery.length >= 2,
      navigateToHit,
      hitsForMonth,
      monthSlugsFromResults,
    }),
    [
      query,
      setQuery,
      submitSearch,
      clearQuery,
      results,
      loading,
      error,
      submittedQuery,
      navigateToHit,
      hitsForMonth,
      monthSlugsFromResults,
    ],
  );

  return <AtualizacoesSearchContext.Provider value={value}>{children}</AtualizacoesSearchContext.Provider>;
}

export function useAtualizacoesSearch() {
  const ctx = useContext(AtualizacoesSearchContext);
  if (!ctx) throw new Error("useAtualizacoesSearch must be used within AtualizacoesSearchProvider");
  return ctx;
}
