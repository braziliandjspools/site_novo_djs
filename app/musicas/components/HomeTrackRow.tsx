"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Loader2, MonitorDown, Play } from "lucide-react";
import type { HomeTrackItem } from "../../lib/vip-music-home";
import { sendTrackToDownloader } from "../lib/send-to-downloader";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { TrackDownloadStatus } from "./TrackDownloadStatus";

type HomeTrackRowProps = {
  track: HomeTrackItem;
  rank?: number;
  compact?: boolean;
};

export function HomeTrackRow({ track, rank, compact = false }: HomeTrackRowProps) {
  const { hasVip } = useMusicasSession();
  const { showToast } = useMusicasToast();
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleDownload(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!hasVip) return;
    setDownloading(true);
    try {
      const name = encodeURIComponent(track.fileName ?? track.title);
      const res = await fetch(`/api/musicas/download/${track.id}?name=${name}`);
      if (!res.ok) throw new Error("Download indisponível");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = track.fileName ?? track.title;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Não foi possível baixar.", "error");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSend(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!hasVip) return;
    setSending(true);
    try {
      await sendTrackToDownloader(track, { relativePath: track.relativePath });
      showToast("Enviado para o Downloader.", "success");
    } catch {
      showToast("Falha ao enviar.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-zinc-800 hover:bg-white/[0.03] ${
        compact ? "py-1.5" : ""
      }`}
    >
      <div className="flex w-10 flex-shrink-0 items-center gap-1 text-xs font-bold text-zinc-500">
        {rank ? <span className={`w-5 text-center ${rank <= 3 ? "text-[#FFDF00]" : ""}`}>#{rank}</span> : null}
        <Link
          href={track.href}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white transition-colors hover:bg-[#1ed760] hover:text-black"
          aria-label={`Abrir ${track.title}`}
        >
          <Play className="h-4 w-4 pl-0.5" />
        </Link>
      </div>

      <div className="min-w-0 flex-1">
        <Link href={track.href} className="block truncate text-sm font-semibold text-white hover:underline">
          {track.title}
        </Link>
        <p className="truncate text-xs text-zinc-500">
          {track.artist}
          {track.bpm ? ` · ${track.bpm} BPM` : ""}
          {track.styleName ? ` · ${track.styleName}` : ""}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        {hasVip && (
          <>
            <button
              type="button"
              onClick={(event) => void handleDownload(event)}
              disabled={downloading}
              className="rounded-md p-2 text-zinc-500 hover:text-white disabled:opacity-40"
              aria-label="Baixar"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={(event) => void handleSend(event)}
              disabled={sending}
              className="rounded-md p-2 text-zinc-500 hover:text-[#1ed760] disabled:opacity-40"
              aria-label="Enviar para Downloader"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorDown className="h-4 w-4" />}
            </button>
          </>
        )}
        <TrackDownloadStatus fileId={track.id} />
      </div>
    </div>
  );
}
