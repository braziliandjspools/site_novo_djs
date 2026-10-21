"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  MonitorDown,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { PLACEHOLDER } from "../../lib/theme";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import { sendTrackToDownloader } from "../lib/send-to-downloader";
import { isDownloaderSendCancelled } from "./DownloaderBulkConfirm";
import { ArtistNameLink } from "./ArtistNameLink";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { playerTrackCoverUrl } from "../lib/player-track-cover";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VipMiniPlayerBar() {
  const { hasVip, authenticated, openLogin } = useMusicasSession();
  const player = useVipMusicPlayer();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const [sending, setSending] = useState(false);
  const [failedArtworkTrackId, setFailedArtworkTrackId] = useState<string | null>(null);

  if (!player.currentTrack) return null;
  const track = player.currentTrack;

  const isPlaying = player.isPlaying;
  const display = getTrackDisplayMetadata(track);
  const albumOrPack = track.album?.trim() || track.pack?.trim() || "";
  const fallbackCoverSrc = player.currentCoverUrl?.trim() || PLACEHOLDER.trackCover;
  const coverSrc = failedArtworkTrackId === track.id
    ? fallbackCoverSrc
    : playerTrackCoverUrl(track, "404");
  const handleArtworkError = () => setFailedArtworkTrackId(track.id);

  async function handleSend() {
    const current = player.currentTrack;
    if (!current) return;
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
      await sendTrackToDownloader(current, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
      });
      showToast("Faixa enviada ao Downloader");
      await sync?.refresh();
    } catch (err) {
      if (isDownloaderSendCancelled(err)) return;
      showToast(err instanceof Error ? err.message : "Erro ao enviar.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div
        className="player-shell player-shell--vip fixed inset-x-2 bottom-0 z-[70] overflow-hidden rounded-[20px] border border-white/10 md:hidden"
        role="region"
        aria-label="Player de música"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt="" onError={handleArtworkError} className="h-full w-full scale-110 object-cover opacity-35 blur-2xl" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(7,10,14,.96),rgba(9,15,20,.94)_55%,rgba(5,12,17,.97))]" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#60cdff]/70 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-3 px-3 pt-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            onError={handleArtworkError}
            className="h-11 w-11 flex-shrink-0 rounded-xl object-cover shadow-lg ring-1 ring-white/15"
          />
          <div className="min-w-0 flex-1 font-[family-name:var(--font-player)]">
            <p className="truncate text-[13px] font-bold tracking-tight text-white" title={display.title}>
              {display.title}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-white/60" title={[display.artist, albumOrPack].filter(Boolean).join(" · ")}>
              <ArtistNameLink artist={display.artist} className="text-white/70" splitCredits={false} />
              {albumOrPack ? <span className="text-white/40"> · {albumOrPack}</span> : null}
            </p>
          </div>

          {hasVip ? (
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <Link
                href={`/api/musicas/download/${track.id}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/85 transition hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-white active:scale-95"
                title="Baixar faixa atual"
                aria-label={`Baixar ${display.title}`}
              >
                <Download className="h-[17px] w-[17px]" />
              </Link>
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSend()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#60cdff]/25 bg-[#60cdff]/[0.09] text-[#a8e7ff] transition hover:bg-[#60cdff]/15 active:scale-95 disabled:opacity-50"
                title="Enviar ao Downloader"
                aria-label="Enviar faixa ao Downloader"
              >
                <MonitorDown className="h-[17px] w-[17px]" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative z-10 mt-2 flex items-center gap-2 px-3">
          <span className="w-8 text-right text-[9px] tabular-nums text-white/50">{formatTime(player.currentTime)}</span>
          <div
            className="group/seek relative h-1.5 min-w-0 flex-1 cursor-pointer overflow-visible rounded-full bg-white/15"
            role="slider"
            tabIndex={0}
            aria-label="Progresso da música"
            aria-valuemin={0}
            aria-valuemax={Math.round(player.duration || 0)}
            aria-valuenow={Math.round(player.currentTime)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                void player.seekBy(5);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                void player.seekBy(-5);
              } else if (event.key === "Home") {
                event.preventDefault();
                void player.seek(0);
              } else if (event.key === "End") {
                event.preventDefault();
                void player.seek(1);
              }
            }}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              if (!rect.width) return;
              void player.seek((event.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#43b9e9] via-[#60cdff] to-[#9ae8ff] transition-[width] duration-75"
              style={{ width: `${player.progress}%` }}
            />
            <span
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(96,205,255,.8)]"
              style={{ left: `calc(${player.progress}% - 5px)` }}
            />
          </div>
          <span className="w-8 text-[9px] tabular-nums text-white/50">{formatTime(player.duration)}</span>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-5 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-1.5">
          <button
            type="button"
            onClick={() => void player.playPrevious()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
            title="Faixa anterior"
            aria-label="Faixa anterior"
          >
            <SkipBack className="h-[18px] w-[18px] fill-current" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPlaying) player.pause();
              else if (player.playingFolderId) void player.toggleTrack(player.playingFolderId, track.id);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#8de1ff] to-[#41b8ed] text-[#061018] shadow-[0_5px_22px_rgba(65,184,237,.3)] transition-transform hover:scale-[1.04] active:scale-95"
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5 pl-0.5" fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={() => void player.playNext()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
            title="Próxima faixa"
            aria-label="Próxima faixa"
          >
            <SkipForward className="h-[18px] w-[18px] fill-current" />
          </button>
        </div>
      </div>
      <div className="h-[calc(150px+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
    </>
  );
}
