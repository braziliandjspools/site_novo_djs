"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  formatEstimatedQuote,
  MUSIC_PRODUCER_PRICING_PLANS,
} from "../lib/music-producer-pricing";
import { MusicProducerSectionHeading } from "./MusicProducerSectionHeading";

function scrollToBriefing() {
  document.getElementById("briefing")?.scrollIntoView({ behavior: "smooth" });
}

export function MusicProducerPricingSection() {
  return (
    <section id="valores" className="border-y border-white/5 site-section px-4 py-12 sm:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <MusicProducerSectionHeading
          badge="Valores"
          title="Investimento na sua produção"
          subtitle="Produções a partir de R$ 80,00. Valores transparentes para você planejar seu projeto — envie o briefing e confirmamos o escopo antes de iniciar."
        />

        <div className="mx-auto mt-10 grid max-w-md gap-4 sm:mt-12 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
          {MUSIC_PRODUCER_PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 text-center transition-all sm:p-6 md:text-left ${
                plan.highlight
                  ? "border-[#1DB954]/50 bg-gradient-to-b from-[#009739]/15 to-[#282828] shadow-lg shadow-[#009739]/10"
                  : "border-white/5 bg-[#282828] hover:border-[#009739]/30 hover:bg-[#333333]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1DB954] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black md:left-6 md:translate-x-0">
                  Mais pedido
                </span>
              )}
              <h3 className="font-display text-lg tracking-wide text-white">{plan.name}</h3>
              <p className="mt-3 font-display text-3xl font-bold text-white">{plan.price}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[#727272]">{plan.period}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#b3b3b3]">{plan.description}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start justify-center gap-2 text-sm text-[#b3b3b3] md:justify-start">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1DB954]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-[#727272] sm:text-sm">
          Valores sujeitos a confirmação conforme complexidade e escopo do projeto. Durações acima do limite ou
          produções especiais podem ser orçadas separadamente.
        </p>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={scrollToBriefing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#009739] to-[#1DB954] px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:from-[#00B347] hover:to-[#1ED760]"
          >
            Solicitar orçamento
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
