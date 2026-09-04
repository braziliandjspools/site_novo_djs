"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PLATFORM_URL } from "../lib/site";
import { PLACEHOLDER } from "../lib/theme";
import { SiteImage } from "./SiteImage";
type ParallaxLayer = {
  depth: number;
  className: string;
  content?: React.ReactNode;
};

const floatingLayers: ParallaxLayer[] = [
  {
    depth: 0.04,
    className:
      "left-[8%] top-[18%] h-48 w-48 rounded-full bg-[#009739]/25 blur-3xl",
  },
  {
    depth: 0.07,
    className:
      "right-[10%] top-[22%] h-56 w-56 rounded-full bg-[#FFDF00]/15 blur-3xl",
  },
  {
    depth: 0.05,
    className:
      "bottom-[20%] left-[35%] h-40 w-40 rounded-full bg-[#002776]/50 blur-3xl",
  },
  {
    depth: 0.1,
    className:
      "right-[22%] bottom-[28%] h-32 w-32 rotate-45 rounded-2xl border border-[#FFDF00]/20 bg-[#FFDF00]/5 backdrop-blur-sm",
  },
  {
    depth: 0.08,
    className:
      "left-[14%] bottom-[30%] h-24 w-24 rounded-full border border-[#009739]/30 bg-[#009739]/10 backdrop-blur-sm",
  },
  {
    depth: 0.12,
    className:
      "top-[32%] right-[8%] h-16 w-16 rounded-full border border-[#6B9FFF]/30 bg-[#002776]/40 backdrop-blur-sm",
  },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden br-pattern"
      >
        <SiteImage
          src={PLACEHOLDER.hero}
          alt=""
          fill
          priority
          className="object-cover opacity-25 transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `translate(${offset.x * -18}px, ${offset.y * -12}px) scale(1.08)`,
          }}
          sizes="100vw"
          quality={60}
        />
        {floatingLayers.map((layer, index) => (
          <div
            key={index}
            className={`pointer-events-none absolute transition-transform duration-300 ease-out will-change-transform ${layer.className}`}
            style={{
              transform: `translate(${offset.x * layer.depth * 120}px, ${offset.y * layer.depth * 120}px)`,
            }}
            aria-hidden
          >
            {layer.content}
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-[#002776]/70 via-[#121212]/95 to-[#121212]" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 md:py-32">
          <div
            className="animate-fade-in-up transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `translate(${offset.x * -8}px, ${offset.y * -6}px)`,
            }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FFDF00]/40 bg-[#FFDF00]/10 px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FFDF00]">
              <span className="h-2 w-2 rounded-full bg-[#009739]" />
              Pools · Curadoria · Remix Services
            </span>
            <h1 className="font-display break-words text-3xl leading-none tracking-wide text-white sm:text-5xl md:text-7xl">
              Packs, curadoria e{" "}
              <span className="bg-gradient-to-r from-[#009739] via-[#FFDF00] to-[#6B9FFF] bg-clip-text text-transparent">
                conteúdo para DJs
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 sm:text-lg">
              Encontre músicas, edits, remixes, acapellas e versões exclusivas selecionadas para facilitar sua
              preparação. Tenha um repertório atualizado, organizado e pronto para deixar seus sets ainda mais completos.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#acervo"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#009739] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-[#00B347] hover:shadow-lg hover:shadow-[#009739]/30 sm:w-auto"
              >
                Ver catálogo de pools
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={PLATFORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border-2 border-[#FFDF00]/60 bg-transparent px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-[#FFDF00] transition-all hover:bg-[#FFDF00]/10 sm:w-auto"
              >
                Acessar plataforma
              </a>
            </div>
          </div>
        </div>
        <div className="br-stripe relative z-10" />
      </section>

      <section className="border-b border-white/5 site-section-blue px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {[
            { value: "400+", label: "Pools & Services" },
            { value: "24/7", label: "Acesso ilimitado" },
            { value: "100%", label: "Curadoria BR" },
            { value: "Mensal", label: "Atualizações" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center">
              <p
                className={`font-display text-3xl tracking-wide ${
                  i % 3 === 0 ? "text-[#00B347]" : i % 3 === 1 ? "text-[#FFDF00]" : "text-[#6B9FFF]"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
