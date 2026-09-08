"use client";

import { Info } from "lucide-react";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { poolPanelClass } from "./atualizacoes-pool-ui";

type AtualizacoesSyncNoticeProps = {
  onSynced?: () => void | Promise<void>;
};

/** Aviso de sincronização do acervo — exibido antes da lista de pastas. */
export function AtualizacoesSyncNotice({ onSynced }: AtualizacoesSyncNoticeProps) {
  return (
    <aside
      className={`mb-4 flex flex-wrap items-start justify-between gap-3 border-[#1ed760]/30 bg-[#12261a] px-3 py-3 text-sm leading-relaxed text-zinc-300 sm:px-4 ${poolPanelClass}`}
      role="status"
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1ed760]" aria-hidden />
        <p>
          Conteúdos novos estão sendo enviados <strong className="font-semibold text-white">diariamente</strong>.
          Até <strong className="font-semibold text-white">outubro de 2026</strong> o acervo estará atualizado.
        </p>
      </div>
      <AtualizacoesDriveSyncButton onSynced={onSynced} className="flex-shrink-0" />
    </aside>
  );
}
