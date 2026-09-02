"use client";

import type { PreviewPlaylist } from "../lib/google-drive";
import { MusicProducerDemoPlayer } from "./MusicProducerDemoPlayer";
import { MusicProducerSectionHeading } from "./MusicProducerSectionHeading";

type MusicProducerDemosSectionProps = {
  initialPlaylists?: PreviewPlaylist[];
};

function scrollToBriefing() {
  document.getElementById("briefing")?.scrollIntoView({ behavior: "smooth" });
}

export function MusicProducerDemosSection({ initialPlaylists = [] }: MusicProducerDemosSectionProps) {
  return (
    <section id="demos" className="site-section px-4 py-12 sm:px-6 md:py-20">
      <div className="mx-auto max-w-5xl">
        <MusicProducerSectionHeading
          badge="Preview"
          title="Ouça algumas possibilidades"
          subtitle="Confira algumas demonstrações de estilos e produções que podem servir como referência para o seu projeto."
        />

        <div className="mt-12">
          <MusicProducerDemoPlayer initialPlaylists={initialPlaylists} />
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Gostou de algum estilo?</h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#b3b3b3] sm:text-base">
            Use uma dessas referências como ponto de partida ou conte sua própria ideia. Criamos uma produção pensada
            especialmente para o seu projeto.
          </p>
          <button
            type="button"
            onClick={scrollToBriefing}
            className="mt-8 rounded-full bg-gradient-to-r from-[#009739] to-[#1DB954] px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-105 hover:from-[#00B347] hover:to-[#1ED760]"
          >
            Quero criar minha música
          </button>
        </div>
      </div>
    </section>
  );
}
