"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MonitorDown } from "lucide-react";

export const DOWNLOADER_BULK_CONFIRM_THRESHOLD = 80;

type DownloaderBulkConfirmDialogProps = {
  open: boolean;
  count: number;
  onConfirm: () => void;
  onDismiss: () => void;
};

/** Confirma envio em massa (>80 faixas) ao BRS Downloader. */
export function DownloaderBulkConfirmDialog({
  open,
  count,
  onConfirm,
  onDismiss,
}: DownloaderBulkConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dl-bulk-confirm-title"
        aria-describedby="dl-bulk-confirm-desc"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12151a] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2 text-[#1ed760]">
            <MonitorDown className="h-5 w-5" />
            <p id="dl-bulk-confirm-title" className="text-sm font-bold uppercase tracking-[0.12em]">
              Confirmar download
            </p>
          </div>
          <p id="dl-bulk-confirm-desc" className="mt-3 text-sm leading-relaxed text-white/70">
            Você está prestes a enviar{" "}
            <span className="font-semibold tabular-nums text-white">{count}</span> faixas ao BRS
            Downloader. Deseja continuar?
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1ed760] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
          >
            Sim, baixar
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            Não, remover fila
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export async function previewPackTrackCount(
  slug: string,
  root: "vip" | "colecoes" = "vip",
): Promise<number> {
  const params = new URLSearchParams({ slug: slug.replace(/^\/+|\/+$/g, "").trim() });
  if (root === "colecoes") params.set("root", "colecoes");
  const response = await fetch(`/api/downloader/pack/preview?${params.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    trackCount?: number;
  };
  if (!response.ok) {
    throw new Error(data.error ?? "Não foi possível verificar a pasta.");
  }
  return typeof data.trackCount === "number" ? data.trackCount : 0;
}
