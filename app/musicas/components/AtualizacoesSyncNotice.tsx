"use client";

import { AlertTriangle } from "lucide-react";

/** Aviso laranja de sincronização do acervo — exibido antes da lista de pastas. */
export function AtualizacoesSyncNotice() {
  return (
    <aside
      className="mb-4 flex flex-wrap items-start gap-3 rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-3 text-sm leading-relaxed text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" aria-hidden />
      <p className="text-amber-100/95">
        Conteúdos novos estão sendo enviados <strong className="font-semibold text-white">diariamente</strong>.
        Até <strong className="font-semibold text-white">outubro de 2026</strong> o acervo estará atualizado.
      </p>
    </aside>
  );
}
