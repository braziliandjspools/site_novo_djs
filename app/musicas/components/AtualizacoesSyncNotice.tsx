"use client";

import { AlertTriangle } from "lucide-react";

/** Aviso de sincronização do acervo — abaixo do hero. */
export function AtualizacoesSyncNotice() {
  return (
    <aside
      className="mb-5 overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-[#FFDF00]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      role="status"
    >
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-[#FFDF00] to-[#009739]" aria-hidden />
      <div className="flex flex-wrap items-start gap-3 px-3 py-3.5 text-sm leading-relaxed sm:px-4">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-amber-50/95">
          Conteúdos novos estão sendo enviados{" "}
          <strong className="font-semibold text-white">diariamente</strong>. Até{" "}
          <strong className="font-semibold text-[#FFDF00]">outubro de 2026</strong> o acervo estará atualizado.
        </p>
      </div>
    </aside>
  );
}
