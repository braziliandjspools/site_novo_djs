"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Headphones, Search, SlidersHorizontal, Zap } from "lucide-react";

/**
 * DJ-pool discovery surface. Reuses the existing Atualizações search route,
 * Drive-backed catalog and protected player; it does not fetch or duplicate MP3s.
 */
const QUICK_SEARCHES = [
  { label: "Funk", query: "funk" },
  { label: "Sertanejo", query: "sertanejo" },
  { label: "House", query: "house" },
  { label: "Dance", query: "dance" },
  { label: "Hip-Hop", query: "hip hop" },
  { label: "Latin", query: "latin" },
  { label: "Extended", query: "extended" },
  { label: "Intro", query: "intro" },
];

function searchHref(query: string) {
  return `/musicas/atualizacoes?q=${encodeURIComponent(query)}`;
}

export function DjPoolDiscovery() {
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) window.location.assign(searchHref(value));
  }

  return (
    <section aria-labelledby="djpool-discovery-heading" className="overflow-hidden rounded-2xl border border-violet-400/20 bg-[#14101e] shadow-[0_18px_60px_-35px_rgba(139,92,246,0.45)]">
      <div className="border-b border-white/10 bg-gradient-to-r from-violet-700/25 via-fuchsia-800/10 to-transparent px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-300">
          <Zap className="h-4 w-4" aria-hidden />
          BRS DJ Pool
          <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-200">Descobrir músicas</span>
        </div>
        <h2 id="djpool-discovery-heading" className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">Encontre a próxima faixa do seu set</h2>
        <p className="mt-1 text-sm text-zinc-400">Pesquise seu acervo, explore estilos e ouça antes de enviar ao BR Downloader.</p>
        <form role="search" onSubmit={onSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="djpool-search" className="sr-only">Buscar música, artista, remix ou estilo</label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" aria-hidden />
            <input id="djpool-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Música, artista, remix ou estilo..."
              className="h-12 w-full rounded-xl border border-white/15 bg-black/40 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20" />
          </div>
          <button type="submit" disabled={!query.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40">
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Buscar no acervo
          </button>
        </form>
      </div>
      <div className="px-4 py-4 sm:px-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400">Acesso rápido por estilo ou versão</p>
        <nav aria-label="Buscas rápidas" className="flex flex-wrap gap-2">
          {QUICK_SEARCHES.map(({ label, query: term }) => (
            <Link key={label} href={searchHref(term)} prefetch={false}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/60 hover:bg-violet-400/10 hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/musicas/atualizacoes" prefetch={false} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-400/40 hover:bg-violet-400/10">
            <span className="rounded-lg bg-violet-500/20 p-2.5 text-violet-300"><Zap className="h-5 w-5" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Últimos lançamentos</span><span className="block text-xs text-zinc-400">Atualizações direto do Drive</span></span>
            <ArrowRight className="h-4 w-4 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-violet-300" aria-hidden />
          </Link>
          <Link href="/musicas/artistas" prefetch={false} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-400/40 hover:bg-violet-400/10">
            <span className="rounded-lg bg-fuchsia-500/20 p-2.5 text-fuchsia-300"><Headphones className="h-5 w-5" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-white">Explorar artistas</span><span className="block text-xs text-zinc-400">Encontre versões e remixes</span></span>
            <ArrowRight className="h-4 w-4 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
