"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MonitorDown, AlertTriangle } from "lucide-react";

type BrowserPackDownloadConfirmProps = {
  open: boolean;
  trackCount: number;
  onConfirm: () => void;
  onDismiss: () => void;
  onPreferDownloader?: () => void;
};

/** Substitui window.confirm ao baixar pack pelo navegador. */
export function BrowserPackDownloadConfirm({
  open,
  trackCount,
  onConfirm,
  onDismiss,
  onPreferDownloader,
}: BrowserPackDownloadConfirmProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onDismiss]);

  if (!open || typeof document === "undefined") return null;

  const trackLabel = trackCount === 1 ? "1 música" : `${trackCount} músicas`;

  return createPortal(
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="browser-dl-confirm-title"
        aria-describedby="browser-dl-confirm-desc"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12151a] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <p
              id="browser-dl-confirm-title"
              className="text-sm font-bold uppercase tracking-[0.12em]"
            >
              Download pelo navegador
            </p>
          </div>
          <p
            id="browser-dl-confirm-desc"
            className="mt-3 text-sm leading-relaxed text-white/70"
          >
            As{" "}
            <span className="font-semibold tabular-nums text-white">{trackLabel}</span>{" "}
            serão baixadas pelo navegador. Isso exige alto processamento da máquina e pode
            deixar o navegador lento.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-[#1ed760]/25 bg-[#1ed760]/10 px-3 py-2.5 text-xs leading-relaxed text-[#1ed760]">
            <MonitorDown className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Prefira o <strong className="font-semibold">BRS Downloader</strong> para baixar
              com mais estabilidade.
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 sm:flex-row-reverse sm:flex-wrap">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white/90 transition-colors hover:bg-white/[0.1] hover:text-white"
          >
            Continuar mesmo assim
          </button>
          {onPreferDownloader ? (
            <button
              type="button"
              onClick={onPreferDownloader}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1ed760] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
            >
              Usar Downloader
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 transition-colors hover:text-zinc-300 sm:w-auto sm:flex-none"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
