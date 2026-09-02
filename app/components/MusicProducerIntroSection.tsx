"use client";

import {
  ArrowRight,
  Cake,
  GraduationCap,
  Headphones,
  Heart,
  Megaphone,
  Mic2,
  Music2,
  Sparkles,
  Star,
} from "lucide-react";
import { PLACEHOLDER } from "../lib/theme";
import { SiteImage } from "./SiteImage";

const services = [
  { icon: Cake, label: "Aniversários", color: "text-[#FFDF00]" },
  { icon: Heart, label: "Casamentos", color: "text-[#ff5500]" },
  { icon: Megaphone, label: "Jingles comerciais", color: "text-[#1DB954]" },
  { icon: Headphones, label: "Produções para DJs", color: "text-[#6B9FFF]" },
  { icon: GraduationCap, label: "Escolas e formaturas", color: "text-[#FFDF00]" },
  { icon: Mic2, label: "Vinhetas e intros", color: "text-[#1DB954]" },
  { icon: Music2, label: "Remixes personalizados", color: "text-[#6B9FFF]" },
  { icon: Star, label: "Projetos exclusivos", color: "text-[#ff5500]" },
];

function scrollToBriefing() {
  document.getElementById("briefing")?.scrollIntoView({ behavior: "smooth" });
}

export function MusicProducerIntroSection() {
  return (
    <section className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#181818] shadow-2xl shadow-black/40">
          <div className="grid lg:grid-cols-2">
            {/* Imagem — primeiro no mobile */}
            <div className="relative order-1 min-h-[260px] sm:min-h-[320px] lg:min-h-[540px]">
              <SiteImage
                src={PLACEHOLDER.musicProducerHero}
                alt="DJ Jessica — produção musical BRS"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={82}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#121212]/30 lg:to-[#181818]" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#009739]/20 via-transparent to-[#002776]/25" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:hidden">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#FFDF00]" />
                  BRS · Brazilian Remix Service
                </div>
              </div>

              <div className="absolute left-5 top-5 hidden lg:block">
                <SiteImage
                  src={PLACEHOLDER.logo}
                  alt=""
                  width={160}
                  height={40}
                  className="h-8 w-auto opacity-90 drop-shadow-lg"
                  sizes="160px"
                />
              </div>
            </div>

            {/* Conteúdo */}
            <div className="order-2 flex flex-col items-center justify-center p-5 text-center sm:p-8 md:items-start md:p-10 md:text-left lg:p-10 xl:p-12">
              <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#1DB954]/30 bg-[#1DB954]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1DB954]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1DB954]" />
                Sua ideia, nossa produção
              </span>

              <h2 className="font-display text-3xl leading-tight tracking-wide text-white sm:text-4xl">
                Sua ideia pode virar{" "}
                <span className="bg-gradient-to-r from-[#1DB954] via-[#FFDF00] to-[#6B9FFF] bg-clip-text text-transparent">
                  música
                </span>
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-[#b3b3b3] sm:text-base">
                Tem uma história, homenagem, campanha ou projeto especial? Na{" "}
                <strong className="font-semibold text-white">BRS — Brazilian Remix Service</strong>, transformamos seu
                briefing em uma produção feita do zero, com arranjo, gravação e mixagem profissionais.
              </p>

              <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2 sm:max-w-none sm:gap-2.5">
                {services.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#282828]/80 px-3 py-2.5 transition-colors hover:border-white/10 hover:bg-[#333333]"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#121212]">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </span>
                    <span className="text-xs font-medium leading-tight text-[#d4d4d4] sm:text-sm">{item.label}</span>
                  </div>
                ))}
              </div>

              <blockquote className="mt-6 max-w-md border-[#FFDF00] px-4 md:max-w-none md:border-l-2 md:pl-4">
                <p className="text-sm leading-relaxed text-[#b3b3b3] sm:text-base">
                  Você traz a ideia e a mensagem. Nós cuidamos da música — do conceito ao arquivo final pronto para
                  usar.{" "}
                  <strong className="font-semibold text-white">
                    Nossa DJ estará pronta para receber seu pedido, entender o que você precisa e transformar sua ideia
                    em uma produção feita especialmente para você.
                  </strong>
                </p>
              </blockquote>

              <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center md:justify-start">
                <button
                  type="button"
                  onClick={scrollToBriefing}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#009739] to-[#1DB954] px-6 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:from-[#00B347] hover:to-[#1ED760]"
                >
                  Solicitar orçamento
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#demos"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-[#b3b3b3] transition-colors hover:border-[#1DB954]/40 hover:text-white"
                >
                  Ouvir demos
                </a>
              </div>
            </div>
          </div>

          <div className="br-stripe-thin" />
        </div>
      </div>
    </section>
  );
}
