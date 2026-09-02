"use client";

import { useEffect } from "react";
import { Mic2, Music, Sparkles, Wand2 } from "lucide-react";
import { MusicProducerPricingSection } from "../components/MusicProducerPricingSection";
import { MusicProducerPlatformsSection } from "../components/MusicProducerPlatformsSection";
import { MusicProducerBriefingForm } from "../components/MusicProducerBriefingForm";
import { MusicProducerDemosSection } from "../components/MusicProducerDemosSection";
import { MusicProducerIntroSection } from "../components/MusicProducerIntroSection";
import { MusicProducerSectionHeading } from "../components/MusicProducerSectionHeading";
import type { PreviewPlaylist } from "../lib/google-drive";

const creations = [
  {
    icon: Mic2,
    title: "Jingles e Vinhetas",
    price: "R$ 90,00 · até 2 min",
    description:
      "Produções curtas e impactantes para rádio, TV, podcasts, eventos e campanhas — com identidade sonora marcante e entrega profissional.",
  },
  {
    icon: Music,
    title: "Músicas Personalizadas",
    price: "R$ 100,00 · até 8 min",
    description:
      "Composições sob medida para aniversários, casamentos, homenagens, empresas e projetos especiais, com letra e produção alinhadas ao seu briefing.",
  },
  {
    icon: Sparkles,
    title: "Produções por Estilo",
    price: "A partir de R$ 80,00",
    description:
      "Sertanejo, eletrônica, funk, infantil, pop, gospel e outros gêneros — adaptamos referências, clima e objetivo do seu projeto.",
  },
  {
    icon: Wand2,
    title: "Intros e Material para DJs",
    price: "R$ 80,00 · até 40 seg",
    description:
      "Vinhetas, intros, drops e material exclusivo para sets, lives e identidade de DJ, com produção pensada para uso em pista e redes.",
  },
];

const steps = [
  {
    step: "01",
    title: "Briefing",
    text: "Conte sua ideia, referências, estilo desejado, ocasião e prazo. Quanto mais detalhes, melhor direcionamos a produção.",
  },
  {
    step: "02",
    title: "Produção",
    text: "Nossa equipe desenvolve a composição, arranjo, gravação e mixagem com base no briefing e nas referências aprovadas.",
  },
  {
    step: "03",
    title: "Revisão",
    text: "Você recebe a demo para ouvir, validar e solicitar ajustes dentro do escopo combinado.",
  },
  {
    step: "04",
    title: "Entrega final",
    text: "Após aprovação, entregamos o arquivo final pronto para uso em eventos, campanhas, redes ou apresentações.",
  },
];

const accentStyles = [
  { icon: "bg-[#009739]/20 text-[#1DB954]", step: "text-[#1DB954]" },
  { icon: "bg-[#FFDF00]/15 text-[#FFDF00]", step: "text-[#FFDF00]" },
  { icon: "bg-[#002776]/30 text-[#6B9FFF]", step: "text-[#6B9FFF]" },
  { icon: "bg-[#009739]/20 text-[#1DB954]", step: "text-[#1DB954]" },
];

type MusicProducerPageClientProps = {
  demoPlaylists: PreviewPlaylist[];
};

export function MusicProducerPageClient({ demoPlaylists }: MusicProducerPageClientProps) {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden px-4 pb-10 pt-8 text-center br-pattern sm:px-6 md:pb-12 md:pt-10 md:text-left">
        <div className="pointer-events-none absolute inset-0 site-glow-green" />
        <div className="pointer-events-none absolute inset-0 site-glow-yellow" />
        <div className="pointer-events-none absolute inset-0 site-glow-blue" />
        <div className="pointer-events-none absolute inset-0 site-glow-spotify" />
        <div className="relative mx-auto max-w-5xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFDF00]/40 bg-[#FFDF00]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFDF00]">
            <span className="h-2 w-2 rounded-full bg-[#1DB954]" />
            Produção Musical
          </span>
          <h1 className="mx-auto max-w-3xl font-display text-3xl tracking-wide text-white sm:text-4xl md:mx-0 lg:text-6xl">
            Criamos a{" "}
            <span className="bg-gradient-to-r from-[#1DB954] via-[#FFDF00] to-[#6B9FFF] bg-clip-text text-transparent">
              trilha sonora
            </span>{" "}
            do seu projeto
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#b3b3b3] sm:text-lg md:mx-0">
            Jingles, músicas personalizadas, vinhetas e produções sob medida para eventos, marcas, campanhas e
            artistas. Do briefing à entrega final, com qualidade profissional.
          </p>
        </div>
        <div className="br-stripe relative z-10 mt-10" />
      </section>

      <MusicProducerIntroSection />

      <section id="o-que-podemos-criar" className="border-y border-white/5 site-section-green px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <MusicProducerSectionHeading
            badge="Serviços"
            title="O que podemos criar"
            subtitle="Produções musicais personalizadas para diferentes objetivos, estilos e formatos de uso."
          />
          <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12 sm:max-w-none sm:grid-cols-2">
            {creations.map((item, i) => (
              <div
                key={item.title}
                className="group flex flex-col items-center rounded-2xl border border-white/5 bg-[#282828] p-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#009739]/40 hover:bg-[#333333] sm:p-6 md:items-start md:text-left"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${accentStyles[i].icon}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg tracking-wide text-white">{item.title}</h3>
                <p className="mt-1 text-sm font-bold text-[#1DB954]">{item.price}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#b3b3b3]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MusicProducerPricingSection />

      <MusicProducerDemosSection initialPlaylists={demoPlaylists} />

      <section id="como-funciona" className="border-y border-white/5 site-section-blue px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-5xl">
          <MusicProducerSectionHeading
            badge="Processo"
            title="Como funciona"
            subtitle="Um fluxo simples do briefing à entrega, com acompanhamento em cada etapa da produção."
          />
          <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12 sm:max-w-none sm:grid-cols-2">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/5 bg-[#282828] p-5 text-center transition-all hover:border-[#002776]/50 hover:bg-[#333333] sm:p-6 md:text-left"
              >
                <span className={`font-display text-3xl tracking-wide ${accentStyles[i].step}`}>{item.step}</span>
                <h3 className="mt-3 font-display text-lg tracking-wide text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#b3b3b3]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MusicProducerPlatformsSection />

      <section id="conte-sua-ideia" className="scroll-mt-24 site-section-rainbow px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-2xl">
          <MusicProducerSectionHeading
            badge="Briefing"
            title="Conte sua ideia"
            subtitle="Descreva o estilo, a ocasião, referências e o que você imagina para a produção. Entraremos em contato para confirmar valores e alinhar detalhes do projeto."
          />
          <MusicProducerBriefingForm />
        </div>
      </section>
    </div>
  );
}
