"use client";

import Link from "next/link";
import { Calendar, ChevronRight, FolderOpen, Loader2, Music2, Search, X } from "lucide-react";
import { slugifyStyleName } from "../../lib/vip-music-slugs";
import { formatStyleNameForDisplay } from "../../lib/style-display";
import type { VipMusicSearchHit } from "../../lib/vip-music-search";
import { hitHref, useAtualizacoesSearch } from "./AtualizacoesSearchContext";

function HitIcon({ type }: { type: VipMusicSearchHit["type"] }) {
  if (type === "month") return <Calendar className="h-3.5 w-3.5 text-[#00ff9d]" />;
  if (type === "week") return <Calendar className="h-3.5 w-3.5 text-[#60cdff]" />;
  if (type === "style") return <FolderOpen className="h-3.5 w-3.5 text-amber-400" />;
  return <Music2 className="h-3.5 w-3.5 text-[#ff5500]" />;
}

function hitTypeLabel(type: VipMusicSearchHit["type"]) {
  if (type === "month") return "Mês";
  if (type === "week") return "Semana";
  if (type === "style") return "Estilo";
  return "Faixa";
}

function hitActionLabel(type: VipMusicSearchHit["type"]) {
  if (type === "month") return "Abrir mês";
  if (type === "week") return "Abrir semana";
  if (type === "style") return "Abrir estilo";
  return "Ir para faixa";
}

export function AtualizacoesSearch() {
  const { query, setQuery, submitSearch, clearQuery, loading } = useAtualizacoesSearch();

  return (
    <form
      className="relative mb-4"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <div className="flex gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar músicas, artistas ou acervos…"
          className="w-full rounded-full border-0 bg-[#242424] py-3 pl-10 pr-10 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:bg-[#2a2a2a] focus:ring-2 focus:ring-white/10"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        </div>
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="flex flex-shrink-0 items-center gap-2 rounded-full bg-[#00ff9d] px-4 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="hidden sm:inline">{loading ? "Pesquisando…" : "Pesquisar"}</span>
        </button>
      </div>
    </form>
  );
}

export function AtualizacoesSearchResults() {
  const { query, results, loading, error, isActive, navigateToHit } = useAtualizacoesSearch();

  if (!isActive) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-md bg-[#181818]">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            Resultados
            {!loading && results.length > 0 && <span className="ml-2 text-zinc-500">({results.length})</span>}
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            {loading
              ? "A primeira pesquisa pode demorar um pouco enquanto o acervo é preparado."
              : "Clique para ir direto ao conteúdo"}
          </p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[#00ff9d]" />}
      </div>

      {error && <p className="px-4 py-3 text-sm text-red-400">{error}</p>}

      {!error && loading && results.length === 0 && (
        <div className="px-4 py-8 text-center">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-[#00ff9d]" />
          <p className="text-sm text-zinc-300">Pesquisando em todo o acervo…</p>
          <p className="mt-1 text-xs text-zinc-600">
            A primeira pesquisa pode demorar um pouco. As próximas tendem a ser mais rápidas.
          </p>
        </div>
      )}

      {!error && !loading && results.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">
          Nenhum resultado para &quot;{query}&quot;
        </p>
      )}

      {!error && results.length > 0 && (
        <ul className="divide-y divide-zinc-800/80 p-1">
          {results.map((hit) => (
            <li key={`${hit.type}-${hit.id}`}>
              <Link
                href={hitHref(hit)}
                onClick={(event) => {
                  event.preventDefault();
                  navigateToHit(hit);
                }}
                className="group flex w-full items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#00ff9d]/5"
              >
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-zinc-900 group-hover:bg-[#009739]/20">
                  <HitIcon type={hit.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white group-hover:text-[#00ff9d]">
                    {hit.type === "style" ? formatStyleNameForDisplay(hit.label) : hit.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-500">{hit.path}</span>
                </span>
                <span className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    {hitTypeLabel(hit.type)}
                  </span>
                  {hit.type === "track" && hit.page && (
                    <span className="text-[10px] font-medium text-zinc-500">
                      Página {hit.page}{hit.totalPages ? ` de ${hit.totalPages}` : ""}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#00ff9d] sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                    {hitActionLabel(hit.type)}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function matchStyleSlug(name: string, slug: string) {
  return slugifyStyleName(name) === slug;
}
