"use client";

import Link from "next/link";
import { Calendar, ChevronRight, FolderOpen, Loader2, Music2, Search, X } from "lucide-react";
import { slugifyFolderName } from "../../lib/vip-music-slugs";
import type { VipMusicSearchHit } from "../../lib/vip-music-search";
import { hitHref, useAtualizacoesSearch } from "./AtualizacoesSearchContext";

function HitIcon({ type }: { type: VipMusicSearchHit["type"] }) {
  if (type === "month") return <Calendar className="h-3.5 w-3.5 text-[#00ff9d]" />;
  if (type === "week") return <Calendar className="h-3.5 w-3.5 text-sky-400" />;
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
  const { query, setQuery, clearQuery, loading } = useAtualizacoesSearch();

  return (
    <div className="relative mb-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar mês, semana, estilo ou faixa..."
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
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#00ff9d]" />
        )}
      </div>
    </div>
  );
}

export function AtualizacoesSearchResults() {
  const { query, results, loading, error, isActive } = useAtualizacoesSearch();

  if (!isActive) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-md bg-[#181818]">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-white">
            Resultados
            {!loading && results.length > 0 && <span className="ml-2 text-zinc-500">({results.length})</span>}
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-600">Clique para ir direto ao conteúdo</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[#00ff9d]" />}
      </div>

      {error && <p className="px-4 py-3 text-sm text-red-400">{error}</p>}

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
                href={hitHref(hit, query)}
                className="group flex w-full items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#00ff9d]/5"
              >
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-zinc-900 group-hover:bg-[#009739]/20">
                  <HitIcon type={hit.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white group-hover:text-[#00ff9d]">
                    {hit.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-500">{hit.path}</span>
                </span>
                <span className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    {hitTypeLabel(hit.type)}
                  </span>
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
  return slugifyFolderName(name) === slug;
}
