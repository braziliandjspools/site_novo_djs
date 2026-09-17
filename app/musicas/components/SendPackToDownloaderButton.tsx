"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Loader2, MonitorDown } from "lucide-react";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import {
  isDownloaderSendCancelled,
  previewPackTrackCount,
} from "./DownloaderBulkConfirm";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";

type SendPackToDownloaderButtonProps = {
  slug: string;
  label?: string;
  className?: string;
  compact?: boolean;
  onCover?: boolean;
  root?: "vip" | "colecoes";
  kind?: "pack" | "artist";
};

export function SendPackToDownloaderButton({
  slug,
  label = "Enviar ao Downloader",
  className = "",
  compact = false,
  onCover = false,
  root = "vip",
  kind = "pack",
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
      let previewCount = 1;
      try {
        previewCount = await previewPackTrackCount(slug, root, kind);
      } catch {
        /* preview opcional */
      }

      const result = await sendPackSlugToDownloader(slug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root,
        kind,
        previewCount,
      });
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : kind === "artist"
            ? `${result.count} faixas do artista adicionadas ao BRS Downloader`
            : `${result.count} faixas adicionadas ao BRS Downloader (estrutura de pastas preservada)`,
      );
      try {
        const key = "brs-dl-sent-packs";
        const raw = sessionStorage.getItem(key);
        const list = raw ? (JSON.parse(raw) as string[]) : [];
        const next = Array.isArray(list) ? list : [];
        const storageKey = kind === "artist" ? `artist:${slug}` : slug;
        if (!next.includes(storageKey)) {
          next.push(storageKey);
          sessionStorage.setItem(key, JSON.stringify(next));
        }
      } catch {
        /* ignore */
      }
      await sync?.refresh();
    } catch (err) {
      if (isDownloaderSendCancelled(err)) return;
      showToast(
        err instanceof Error
          ? err.message
          : kind === "artist"
            ? "Não foi possível enviar o artista."
            : "Não foi possível enviar a pasta.",
        "error",
      );
    } finally {
      setSending(false);
    }
  }

  function wrap(button: ReactNode) {
    return <>{button}</>;
  }

  if (onCover) {
    return wrap(
      <button
        type="button"
        onClick={(event) => void handleClick(event)}
        disabled={sending}
        title={label}
        aria-label={label}
        className={`inline-flex max-w-[90%] cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#1ed760] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg shadow-black/40 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5 sm:text-[11px] ${className}`}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
        <span className="truncate">{sending ? "Enviando…" : "Downloader"}</span>
      </button>,
    );
  }

  if (compact) {
    return wrap(
      <button
        type="button"
        onClick={(event) => void handleClick(event)}
        disabled={sending}
        title={label}
        aria-label={label}
        className={`flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#1ed760]/45 bg-[#1ed760]/20 text-[#1ed760] transition-colors hover:bg-[#1ed760]/35 hover:text-[#7dffb0] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
      </button>,
    );
  }

  return wrap(
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={sending}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1ed760]/40 bg-[#1ed760]/10 px-5 py-2.5 text-xs font-bold text-[#1ed760] transition-colors hover:border-[#1ed760] hover:bg-[#1ed760]/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
      <span>{sending ? "Enviando…" : label}</span>
    </button>,
  );
}
