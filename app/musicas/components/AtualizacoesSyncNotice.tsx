"use client";

import { Info } from "lucide-react";

/** Aviso de sincronização do acervo — exibido antes da lista de pastas. */
export function AtualizacoesSyncNotice() {
  return (
    <aside
      className="mb-5 flex gap-3 rounded-xl border border-[#1ed760]/25 bg-[#1ed760]/10 px-4 py-3.5 text-sm leading-relaxed text-zinc-200"
      role="status"
    >
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1ed760]" aria-hidden />
      <p>
        Conteúdos novos estão sendo enviados <strong className="font-semibold text-white">diariamente</strong>.
        Até <strong className="font-semibold text-white">outubro de 2026</strong> o acervo estará atualizado.
      </p>
    </aside>
  );
}
