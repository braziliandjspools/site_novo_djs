"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MonitorDown } from "lucide-react";

export class DownloaderSendCancelledError extends Error {
  constructor() {
    super("Envio ao Downloader cancelado.");
    this.name = "DownloaderSendCancelledError";
  }
}

export function isDownloaderSendCancelled(error: unknown): boolean {
  return error instanceof DownloaderSendCancelledError || (error instanceof Error && error.name === "DownloaderSendCancelledError");
}

type ConfirmRequest = {
  count: number;
  label?: string;
  resolve: (ok: boolean) => void;
};

type ConfirmApi = {
  requestConfirm: (input: { count: number; label?: string }) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmApi | null>(null);

let imperativeApi: ConfirmApi | null = null;

/** Confirma qualquer envio ao Downloader (1 faixa ou lote). */
export function requestDownloaderConfirm(input: {
  count: number;
  label?: string;
}): Promise<boolean> {
  if (imperativeApi) return imperativeApi.requestConfirm(input);
  if (typeof window !== "undefined") {
    const msg =
      input.count <= 1
        ? `Enviar ${input.label ? `“${input.label}”` : "esta faixa"} ao BRS Downloader?`
        : `Enviar ${input.count} faixas ao BRS Downloader?`;
    return Promise.resolve(window.confirm(msg));
  }
  return Promise.resolve(false);
}

export async function assertDownloaderConfirm(input: {
  count: number;
  label?: string;
}): Promise<void> {
  const ok = await requestDownloaderConfirm(input);
  if (!ok) throw new DownloaderSendCancelledError();
}

export function DownloaderConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const requestConfirm = useCallback((input: { count: number; label?: string }) => {
    return new Promise<boolean>((resolve) => {
      setRequest({
        count: Math.max(1, input.count),
        label: input.label,
        resolve: (ok) => {
          setRequest(null);
          resolve(ok);
        },
      });
    });
  }, []);

  const api = useMemo(() => ({ requestConfirm }), [requestConfirm]);

  useEffect(() => {
    imperativeApi = api;
    return () => {
      if (imperativeApi === api) imperativeApi = null;
    };
  }, [api]);

  useEffect(() => {
    if (!request) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") request.resolve(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [request]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {request && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
              role="presentation"
              onClick={() => request.resolve(false)}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="dl-confirm-title"
                aria-describedby="dl-confirm-desc"
                className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12151a] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <div className="flex items-center gap-2 text-[#1ed760]">
                    <MonitorDown className="h-5 w-5" />
                    <p id="dl-confirm-title" className="text-sm font-bold uppercase tracking-[0.12em]">
                      Confirmar envio
                    </p>
                  </div>
                  <p id="dl-confirm-desc" className="mt-3 text-sm leading-relaxed text-white/70">
                    {request.count <= 1 ? (
                      <>
                        Enviar{" "}
                        {request.label ? (
                          <span className="font-semibold text-white">“{request.label}”</span>
                        ) : (
                          "esta faixa"
                        )}{" "}
                        ao BRS Downloader?
                      </>
                    ) : (
                      <>
                        Você está prestes a enviar{" "}
                        <span className="font-semibold tabular-nums text-white">{request.count}</span>{" "}
                        faixas ao BRS Downloader. Deseja continuar?
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 p-4 sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => request.resolve(true)}
                    className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1ed760] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
                  >
                    Sim, enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => request.resolve(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}

export function useDownloaderConfirm() {
  return useContext(ConfirmContext);
}

/** @deprecated use DownloaderConfirmProvider + requestDownloaderConfirm */
export const DOWNLOADER_BULK_CONFIRM_THRESHOLD = 0;
/** Confirmação de download em massa no navegador (não Downloader). */
export const BROWSER_BULK_CONFIRM_THRESHOLD = 80;

type DownloaderBulkConfirmDialogProps = {
  open: boolean;
  count: number;
  onConfirm: () => void;
  onDismiss: () => void;
};

/** Mantido por compat — preferir o provider global. */
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
  kind: "pack" | "artist" = "pack",
): Promise<number> {
  const params = new URLSearchParams({ slug: slug.replace(/^\/+|\/+$/g, "").trim() });
  if (kind === "artist") params.set("kind", "artist");
  else if (root === "colecoes") params.set("root", "colecoes");
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
