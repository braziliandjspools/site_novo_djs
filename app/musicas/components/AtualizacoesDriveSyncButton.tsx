"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { clearMusicasCache } from "../lib/musicas-fetch-cache";
import { useMusicasToast } from "./MusicasToast";

type AtualizacoesDriveSyncButtonProps = {
  onSynced?: (result?: { syncedAt?: string; folderCount?: number }) => void | Promise<void>;
  className?: string;
  compact?: boolean;
};

/** Estilo único do botão Sincronizar (heroes, listas e pastas). */
export const DRIVE_SYNC_BUTTON_CLASS =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 text-sm font-bold text-yellow-300 transition-colors transition-transform hover:scale-[1.01] hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100";

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
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        folderCount?: number;
        syncedAt?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Falha ao sincronizar.");
      }
      clearMusicasCache("/api/musicas/");
      await onSynced?.({
        syncedAt: data.syncedAt,
        folderCount: data.folderCount,
      });
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
        className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 transition-colors hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
      aria-label="Sincronizar com o Google Drive"
      className={`${DRIVE_SYNC_BUTTON_CLASS} ${className}`}
    >
      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {syncing ? "Sincronizando…" : "Sincronizar"}
    </button>
  );
}
