"use client";

import Link from "next/link";
import { Layers, Sparkles } from "lucide-react";
import { MusicasPageHeader } from "../MusicasShell";

export default function ColecoesPage() {
  return (
    <div>
      <MusicasPageHeader
        title="Coleções"
        subtitle="Curadorias especiais e packs organizados para você."
      />

      <section className="flex min-h-[320px] flex-col items-center justify-center rounded-md border border-zinc-800/90 bg-[#181818] px-6 py-16 text-center sm:min-h-[400px]">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-zinc-900 ring-1 ring-zinc-700">
          <Layers className="h-8 w-8 text-[#1ed760]" />
        </div>

        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#1ed760]">
          <Sparkles className="h-4 w-4" />
          Em breve
        </p>

        <h2 className="text-2xl font-bold text-white sm:text-3xl">Página em criação</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
          Estamos preparando coleções exclusivas com seleções temáticas, packs especiais e curadoria da equipe
          Brazilian Packs. Volte em breve.
        </p>

        <Link
          href="/musicas/atualizacoes"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#1ed760] px-6 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02]"
        >
          Ver atualizações
        </Link>
      </section>
    </div>
  );
}
