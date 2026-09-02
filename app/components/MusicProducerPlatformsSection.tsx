"use client";

import { Globe, Radio, Store } from "lucide-react";
import { MusicProducerDistributedShowcase } from "./MusicProducerDistributedShowcase";
import { MusicProducerSectionHeading } from "./MusicProducerSectionHeading";

const platforms = [
  { name: "Beatport", accent: "text-[#94E400]" },
  { name: "Spotify", accent: "text-[#1DB954]" },
  { name: "Apple Music", accent: "text-[#FA586A]" },
  { name: "Deezer", accent: "text-[#A238FF]" },
  { name: "Amazon Music", accent: "text-[#25D1DA]" },
  { name: "YouTube Music", accent: "text-[#FF0000]" },
  { name: "Tidal", accent: "text-[#FFFFFF]" },
  { name: "Traxsource", accent: "text-[#FF5500]" },
];

const highlights = [
  {
    icon: Store,
    title: "Pronta para lançamento",
    text: "Entregamos arquivos finais com qualidade profissional, prontos para distribuição digital nas lojas e plataformas de streaming.",
  },
  {
    icon: Globe,
    title: "Alcance global",
    text: "Sua produção pode estar disponível para ouvintes, DJs e público de diferentes países, ampliando a visibilidade do seu projeto.",
  },
  {
    icon: Radio,
    title: "Orientação completa",
    text: "Ajudamos você a entender o caminho para publicar sua faixa — do arquivo final ao cadastro nas principais plataformas do mercado.",
  },
];

export function MusicProducerPlatformsSection() {
  return (
    <section id="plataformas" className="border-y border-white/5 site-section-yellow px-4 py-12 sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <MusicProducerSectionHeading
          badge="Distribuição"
          title="Sua música nas principais plataformas"
          subtitle="Além da produção, orientamos você para que sua faixa possa chegar às maiores lojas e serviços de streaming do mundo — como Beatport, Spotify, Apple Music e muito mais."
        />

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:mt-12">
          {platforms.map((platform) => (
            <span
              key={platform.name}
              className="rounded-full border border-white/10 bg-[#282828] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-[#333333]"
            >
              <span className={platform.accent}>{platform.name}</span>
            </span>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12 sm:max-w-none sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/5 bg-[#282828] p-5 text-center transition-all hover:border-[#FFDF00]/30 hover:bg-[#333333] sm:p-6 md:text-left"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFDF00]/15 md:mx-0">
                <item.icon className="h-6 w-6 text-[#FFDF00]" />
              </div>
              <h3 className="font-display text-lg tracking-wide text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#b3b3b3]">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-[#999999] sm:text-base">
          Ideal para artistas, DJs, produtores e projetos que querem ir além da demo — com uma produção pensada para
          uso profissional e publicação nas principais plataformas digitais.
        </p>

        <MusicProducerDistributedShowcase />
      </div>
    </section>
  );
}
