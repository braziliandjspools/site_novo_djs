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
  Volume2,
  VolumeX,
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
  const [muted, setMuted] = useState(false);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(1);
  const [sending, setSending] = useState(false);

  if (!player.currentTrack) return null;
  const track = player.currentTrack;

  const isPlaying = player.isPlaying;
  const display = getTrackDisplayMetadata(track);
  const albumOrPack = track.album?.trim() || track.pack?.trim() || "";
  const coverSrc =
    track.coverUrl?.trim() || player.currentCoverUrl?.trim() || PLACEHOLDER.trackCover;
  const volume = muted ? 0 : player.volume;

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

  function toggleMute() {
    if (muted || player.volume === 0) {
      const restore = volumeBeforeMute > 0 ? volumeBeforeMute : 0.8;
      player.setVolume(restore);
      setMuted(false);
      return;
    }
    setVolumeBeforeMute(player.volume);
    player.setVolume(0);
    setMuted(true);
  }

  return (
    <div className="player-shell player-shell--vip fixed bottom-0 left-0 right-0 z-50 overflow-hidden rounded-none border-x-0 border-b-0">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverSrc} alt="" className="h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1210]/95 via-[#0e1a16]/88 to-[#121816]/92" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1ed760]/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          className="h-14 w-14 flex-shrink-0 rounded-xl object-cover shadow-[0_10px_28px_rgba(0,0,0,0.45)] ring-2 ring-white/15 sm:h-16 sm:w-16"
        />

        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => void player.seekBy(-10)}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            title="Voltar 10s"
            aria-label="Voltar 10 segundos"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void player.playPrevious()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Anterior"
            aria-label="Faixa anterior"
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPlaying) player.pause();
              else if (player.playingFolderId) {
                void player.toggleTrack(player.playingFolderId, track.id);
              }
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2dff7a] to-[#1ed760] text-black shadow-[0_8px_24px_rgba(30,215,96,0.4)] transition-transform hover:scale-[1.05] active:scale-95"
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 pl-0.5" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={() => void player.playNext()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Próxima"
            aria-label="Próxima faixa"
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => void player.seekBy(10)}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            title="Avançar 10s"
            aria-label="Avançar 10 segundos"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1 font-[family-name:var(--font-player)]">
          <p className="truncate text-[15px] font-bold tracking-tight text-white sm:text-base" title={display.title}>
            {display.title}
          </p>
          <p
            className="mt-0.5 truncate text-[12px] text-white/55 sm:text-[13px]"
            title={[display.artist, albumOrPack].filter(Boolean).join(" · ")}
          >
            <ArtistNameLink
              artist={display.artist}
              className="text-white/70 hover:text-[#1ed760]"
              splitCredits={false}
            />
            {albumOrPack ? <span className="text-white/35"> · {albumOrPack}</span> : null}
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="w-9 text-right text-[10px] tabular-nums text-white/40">
              {formatTime(player.currentTime)}
            </span>
            <div
              className="player-progress-track group/seek relative h-1.5 flex-1 cursor-pointer overflow-visible rounded-full bg-white/15"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientX - rect.left) / rect.width;
                void player.seek(ratio);
              }}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00b4d8] via-[#1ed760] to-[#2dff7a] transition-[width] duration-75"
                style={{ width: `${player.progress}%` }}
              />
              <span
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-md transition group-hover/seek:opacity-100"
                style={{ left: `calc(${player.progress}% - 6px)` }}
              />
            </div>
            <span className="w-9 text-[10px] tabular-nums text-white/40">
              {formatTime(player.duration)}
            </span>
          </div>
        </div>

        <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={muted || volume === 0 ? "Ativar som" : "Silenciar"}
          >
            {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => {
              const next = Number(event.target.value);
              setMuted(next === 0);
              player.setVolume(next);
            }}
            className="player-volume h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#1ed760]"
            aria-label="Volume"
          />
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          {hasVip ? (
            <>
              <Link
                href={`/api/musicas/download/${track.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-300 transition hover:border-[#1ed760]/40 hover:text-white"
                title="Baixar faixa"
              >
                <Download className="h-4 w-4" />
              </Link>
              <button
                type="button"
                disabled={sending}
                onClick={() => void handleSend()}
                className="rounded-xl border border-[#1ed760]/35 bg-[#1ed760]/15 p-2 text-[#1ed760] transition hover:bg-[#1ed760]/25 disabled:opacity-50"
                title="Enviar ao Downloader"
              >
                <MonitorDown className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
