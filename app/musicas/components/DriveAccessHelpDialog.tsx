"use client";

import { useEffect, useRef } from "react";
import { Download, HardDrive, MonitorDown, X } from "lucide-react";

export function DriveAccessHelpDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="brs-drive-help-title"
      aria-describedby="brs-drive-help-description"
      className="fixed inset-0 m-auto w-[min(92vw,28rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-[#ff2ea6]/25 bg-[#101713] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop:bg-black/80"
    >
      <div className="h-1 bg-gradient-to-r from-[#ff2ea6] via-[#ff2ea6]/60 to-transparent" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff2ea6]/30 bg-[#ff2ea6]/10 text-[#ff2ea6]">
            <HardDrive className="h-5 w-5" aria-hidden="true" />
          </span>
          <button type="button" onClick={onClose} aria-label="Fechar aviso" className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="brs-drive-help-title" className="mt-5 text-xl font-bold">Acesso pelo Google Drive</h2>
        <p id="brs-drive-help-description" className="mt-2 text-sm leading-relaxed text-white/70">
          Para copiar o link da faixa no Google Drive, sua conta cadastrada na BRS precisa usar um endereço <strong className="text-[#ff2ea6]">@gmail.com</strong>.
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
            <MonitorDown className="mt-0.5 h-5 w-5 shrink-0 text-[#ff2ea6]" aria-hidden="true" />
            <p className="text-sm text-white/75"><strong className="block text-white">Pasta inteira</strong>Use o BR Downloader para baixar a pasta completa.</p>
          </div>
          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-[#ff2ea6]" aria-hidden="true" />
            <p className="text-sm text-white/75"><strong className="block text-white">Faixa individual</strong>Use o botão de download da música no navegador.</p>
          </div>
        </div>

        <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-[#ff2ea6] px-4 py-3 text-sm font-bold text-[#07120b] transition hover:bg-[#36ec78]">
          Entendi
        </button>
      </div>
    </dialog>
  );
}
