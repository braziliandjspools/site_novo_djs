"use client";

import { useState, type MouseEvent } from "react";
import { Loader2, MonitorDown } from "lucide-react";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";

type SendPackToDownloaderButtonProps = {
  slug: string;
  /** Ex.: "Enviar mês ao Downloader" */
  label?: string;
  className?: string;
  compact?: boolean;
};

export function SendPackToDownloaderButton({
  slug,
  label = "Enviar ao Downloader",
  className = "",
  compact = false,
}: SendPackToDownloaderButtonProps) {
  const { authenticated, openLogin, hasVip } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const [sending, setSending] = useState(false);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (sending) return;

    if (!authenticated) {
      openLogin();
      return;
    }
    if (!hasVip) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return;
    }

    setSending(true);
    try {
      const result = await sendPackSlugToDownloader(slug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
      });
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader (estrutura de pastas preservada)`,
      );
      await sync?.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSending(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={(event) => void handleClick(event)}
        disabled={sending}
        title={label}
        aria-label={label}
        className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#1ed760] transition-colors hover:bg-[#1ed760]/15 disabled:opacity-50 ${className}`}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={sending}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#1ed760]/40 bg-[#1ed760]/10 px-4 py-2 text-xs font-bold text-[#1ed760] transition-colors hover:border-[#1ed760] hover:bg-[#1ed760]/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
      <span>{sending ? "Enviando…" : label}</span>
    </button>
  );
}
