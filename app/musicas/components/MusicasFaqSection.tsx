"use client";

import { ChevronDown } from "lucide-react";
import { MUSICAS_FAQS } from "../lib/musicas-faqs";

export function MusicasFaqSection() {
  return (
    <section id="faq" className="mt-12 border-t border-zinc-800 pt-10">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1ed760]">FAQ</p>
        <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Perguntas frequentes</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Tudo sobre navegação, player, downloads e acesso VIP na plataforma de músicas.
        </p>
      </div>

      <div className="space-y-2">
        {MUSICAS_FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-md border border-zinc-800 bg-[#1a1a1a] open:border-[#1ed760]/40 open:bg-[#1a1a1a]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-white">
              <span>{faq.q}</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-[#1ed760] transition-transform group-open:rotate-180" />
            </summary>
            <p className="border-t border-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-400">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
