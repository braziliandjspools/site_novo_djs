"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useMusicasToast } from "./MusicasToast";

type AtualizacoesDriveSyncButtonProps = {
  onSynced?: () => void | Promise<void>;
  className?: string;
  compact?: boolean;
};

/** Força invalidar o cache do Google Drive e recarregar a lista atual. */
export function AtualizacoesDriveSyncButton({
  onSynced,
  className = "",
  compact = false,
}: AtualizacoesDriveSyncButtonProps) {
  const { showToast } = useMusicasToast();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/musicas/sync", { method: "POST", cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; error?: string; folderCount?: number };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Falha ao sincronizar.");
      }
      await onSynced?.();
      showToast(
        typeof data.folderCount === "number"
          ? `Acervo atualizado · ${data.folderCount} pastas na raiz`
          : "Acervo atualizado do Google Drive",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível sincronizar.", "error");
    } finally {
      setSyncing(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleSync()}
        disabled={syncing}
        title="Sincronizar com o Google Drive"
        aria-label="Sincronizar com o Google Drive"
        className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-amber-400/45 bg-amber-400/20 text-amber-300 transition-colors hover:bg-amber-400/35 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleSync()}
      disabled={syncing}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-amber-400/45 bg-amber-400/15 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-200 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      {syncing ? "Sincronizando…" : "Sincronizar"}
    </button>
  );
}
