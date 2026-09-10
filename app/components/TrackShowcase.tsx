"use client";

import { useEffect, useState } from "react";
import { Disc3, FolderOpen, Loader2, Pause, Play } from "lucide-react";
import { useProtectedPlayer } from "../hooks/useProtectedPlayer";
import type { PreviewPlaylist, PreviewTrack } from "../lib/google-drive";
import { getTrackDisplayMetadata } from "../lib/track-display-metadata";
import { PLACEHOLDER } from "../lib/theme";
import { SiteImage } from "./SiteImage";

type TrackShowcaseProps = {
  initialPlaylists?: PreviewPlaylist[];
  variant?: "default" | "music-producer";
  fetchEndpoint?: string;
  summaryTitle?: string;
  summarySubtitle?: string;
  playlistTrackLabel?: (count: number) => string;
  loadingLabel?: string;
  emptyLabel?: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type TrackPlaylistPanelProps = {
  playlist: PreviewPlaylist;
  player: ReturnType<typeof useProtectedPlayer>;
  isGlobalBusy: boolean;
  trackCountLabel: (count: number) => string;
  variant: "default" | "music-producer";
};

function TrackPlaylistPanel({ playlist, player, isGlobalBusy, trackCountLabel, variant }: TrackPlaylistPanelProps) {
  const isPreviewList = variant === "default";
  return (
    <div
      className={
        isPreviewList
          ? "overflow-hidden rounded-2xl border border-zinc-700/70 bg-black shadow-[0_1px_0_rgba(255,255,255,0.03)]"
          : "overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#002776]/20 to-[#181818] shadow-xl shadow-black/30"
      }
    >
      <div
        className={
          isPreviewList
            ? "flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700/70 bg-[#111111] px-3 py-3 sm:px-4"
            : "flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#009739]/20">
            <FolderOpen className="h-5 w-5 text-[#00B347]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{playlist.name}</p>
            <p className="text-xs text-gray-500">{trackCountLabel(playlist.tracks.length)}</p>
          </div>
        </div>
        <span className="text-eyebrow text-[#1ed760]">Prévia</span>
      </div>

      <div className={isPreviewList ? "max-h-[420px] space-y-px overflow-y-auto" : "max-h-[420px] space-y-2 overflow-y-auto p-3 sm:p-4"}>
        {playlist.tracks.map((track, index) => {
          const isPlaying = player.playingId === track.id;
          const isLoading = player.loadingId === track.id;
          const isBusy = isGlobalBusy && player.loadingId !== track.id;

          return (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              isPlaying={isPlaying}
              isLoading={isLoading}
              isBusy={isBusy}
              onToggle={() => void player.toggle(track.id)}
              progress={isPlaying ? player.progress : 0}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
}

type TrackRowProps = {
  track: PreviewTrack;
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  isBusy: boolean;
  onToggle: () => void;
  progress: number;
  variant: "default" | "music-producer";
};

function TrackRow({ track, index, isPlaying, isLoading, isBusy, onToggle, progress, variant }: TrackRowProps) {
  const isMusicProducer = variant === "music-producer";
  const display = getTrackDisplayMetadata(track);

  if (isMusicProducer) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${
          isPlaying
            ? "border-[#009739]/50 bg-[#009739]/10 shadow-md shadow-[#009739]/10"
            : "border-white/[0.08] bg-white/[0.03] hover:border-[#009739]/30 hover:bg-white/[0.05]"
        }`}
      >
        {isPlaying && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-[#009739]/30" aria-hidden>
            <div
              className="h-full bg-gradient-to-r from-[#009739] to-[#FFDF00] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className={`flex gap-3 p-3 sm:gap-4 sm:p-4 ${track.story ? "items-start" : "items-center"}`}>
          <div className="relative h-14 w-14 flex-shrink-0 sm:h-16 sm:w-16">
            <SiteImage
              src={PLACEHOLDER.trackCover}
              alt=""
              fill
              className="rounded-lg object-cover ring-1 ring-white/10"
              sizes="64px"
            />
            <button
              type="button"
              onClick={onToggle}
              disabled={isBusy}
              aria-label={isPlaying ? `Pausar ${display.title}` : `Ouvir ${display.title}`}
              className={`absolute inset-0 flex items-center justify-center rounded-lg transition-all ${
                isPlaying ? "bg-[#009739]/80" : "bg-black/40 hover:bg-[#009739]/70"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 text-white" fill="white" />
              ) : (
                <Play className="ml-0.5 h-5 w-5 text-white" fill="white" />
              )}
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold sm:text-base ${isPlaying ? "text-[#00B347]" : "text-white"}`}>
              {display.title}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#FFDF00]">
              {display.artist || track.pack}
            </p>
            {track.story && (
              <p className={`mt-2 text-xs leading-relaxed text-gray-400 ${isPlaying ? "" : "line-clamp-2"}`}>
                {track.story}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Prévia da home — mesmo visual da lista de /musicas/atualizacoes, só play */
  return (
    <article
      className={`border-b border-zinc-800/60 transition-colors last:border-b-0 ${
        isPlaying ? "bg-white/[0.04]" : "hover:bg-white/[0.03]"
      }`}
    >
      <div className="grid grid-cols-[28px_40px_minmax(0,1fr)] items-center gap-x-1.5 px-1.5 py-1.5 sm:grid-cols-[32px_44px_minmax(0,1fr)] sm:gap-x-2 sm:px-2 sm:py-2">
        <span className="text-center font-mono text-[10px] tabular-nums text-zinc-600 sm:text-[11px]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={onToggle}
          disabled={isBusy}
          aria-label={isPlaying ? `Pausar ${display.title}` : `Reproduzir ${display.title}`}
          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${
            isPlaying ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={isBusy}
          className="min-w-0 overflow-hidden text-left"
          aria-label={`${display.title} — ${display.artist}`}
          title={`${display.title} — ${display.artist}`}
        >
          <p className="text-track-title truncate text-white">{display.title}</p>
          <p className="text-track-artist mt-0.5 truncate">{display.artist}</p>
        </button>
      </div>
      {isPlaying ? (
        <div className="flex items-center gap-2 px-1.5 pb-1.5 sm:pl-[calc(32px+44px+0.5rem)]">
          <div className="h-3 min-w-0 flex-1 py-1">
            <div className="h-0.5 rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-zinc-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function TrackShowcase({
  initialPlaylists = [],
  variant = "default",
  fetchEndpoint = "/api/tracks",
  summaryTitle = "Preview por pasta",
  summarySubtitle,
  playlistTrackLabel = (count) => `${count} ${count === 1 ? "faixa" : "faixas"} nesta pasta`,
  loadingLabel = "Carregando catálogo demo...",
  emptyLabel = "Nenhuma faixa encontrada na pasta de preview.",
}: TrackShowcaseProps) {
  const [playlists, setPlaylists] = useState<PreviewPlaylist[]>(initialPlaylists);
  const [loading, setLoading] = useState(initialPlaylists.length === 0);
  const [error, setError] = useState<string | null>(null);
  const player = useProtectedPlayer();

  useEffect(() => {
    if (initialPlaylists.length > 0) return;

    let cancelled = false;

    async function loadPlaylists() {
      try {
        const res = await fetch(fetchEndpoint);
        const data = (await res.json()) as {
          playlists?: PreviewPlaylist[];
          error?: string;
        };
        if (cancelled) return;
        if (data.playlists?.length) {
          setPlaylists(data.playlists);
          setError(null);
        } else if (data.error) {
          setError(data.error);
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar as faixas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlaylists();
    return () => {
      cancelled = true;
    };
  }, [initialPlaylists.length, fetchEndpoint]);

  const allTracks = playlists.flatMap((playlist) => playlist.tracks);
  const activeTrack = allTracks.find((track) => track.id === player.playingId) ?? null;
  const activePlaylist = playlists.find((playlist) => playlist.tracks.some((track) => track.id === player.playingId));
  const totalTracks = allTracks.length;
  const isGlobalBusy = player.loadingId !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 player-shell py-20 font-[family-name:var(--font-player)] text-sm text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#009739]" />
        {loadingLabel}
      </div>
    );
  }

  if (!playlists.length) {
    return (
      <p className="py-8 text-center font-[family-name:var(--font-player)] text-sm text-gray-500">
        {error ?? player.error ?? emptyLabel}
      </p>
    );
  }

  const resolvedSummarySubtitle =
    summarySubtitle ??
    `${playlists.length} ${playlists.length === 1 ? "pasta" : "pastas"} · ${totalTracks} faixas no total`;

  return (
    <div className="space-y-8 font-[family-name:var(--font-player)]">
      <div className="player-shell overflow-hidden">
        <div className="br-stripe-thin" />
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#002776]/40">
              <Disc3 className="h-5 w-5 text-[#6B9FFF]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{summaryTitle}</p>
              <p className="text-xs text-gray-500">{resolvedSummarySubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {(player.error || error) && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2 text-center text-xs text-red-300">
          {player.error ?? error}
        </p>
      )}

      {playlists.map((playlist) => (
        <TrackPlaylistPanel
          key={playlist.id}
          playlist={playlist}
          player={player}
          isGlobalBusy={isGlobalBusy}
          trackCountLabel={playlistTrackLabel}
          variant={variant}
        />
      ))}

      {activeTrack && (
        <div className="sticky bottom-4 overflow-hidden rounded-2xl border border-[#009739]/30 bg-[#001530]/95 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="br-stripe-thin" />
          <div className="px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0">
                  <SiteImage
                    src={PLACEHOLDER.trackCover}
                    alt=""
                    fill
                    className="rounded-lg object-cover ring-2 ring-[#009739]/50"
                    sizes="48px"
                  />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#009739]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{activeTrack.title}</p>
                  <p className="truncate text-xs text-gray-400">
                    {variant === "music-producer" ? activeTrack.artist || activePlaylist?.name : activeTrack.artist}
                  </p>
                  {variant === "music-producer" && activeTrack.story ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{activeTrack.story}</p>
                  ) : (
                    <p className="truncate text-[10px] text-gray-500">{activePlaylist?.name ?? activeTrack.pack}</p>
                  )}
                  {variant !== "music-producer" && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {activeTrack.bpm && (
                        <span className="font-mono text-[10px] font-bold text-[#FFDF00]">{activeTrack.bpm} BPM</span>
                      )}
                      {activeTrack.version && (
                        <span className="text-[10px] text-gray-500">· {activeTrack.version}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void player.toggle(activeTrack.id)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#009739] text-white shadow-lg shadow-[#009739]/30 transition-transform hover:scale-105 sm:order-first"
              >
                <Pause className="h-4 w-4" fill="currentColor" />
              </button>

              <div className="flex w-full flex-col gap-1 sm:max-w-xs sm:flex-1">
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Progresso da faixa"
                  aria-valuenow={Math.round(player.progress)}
                  className="group h-1.5 cursor-pointer rounded-full bg-white/10"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    player.seek((e.clientX - rect.left) / rect.width);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") player.seek((player.currentTime + 5) / (player.duration || 1));
                    if (e.key === "ArrowLeft") player.seek(Math.max(0, player.currentTime - 5) / (player.duration || 1));
                  }}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#009739] via-[#00B347] to-[#FFDF00] transition-all"
                    style={{ width: `${player.progress}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-gray-500">
                  <span>{formatTime(player.currentTime)}</span>
                  <span>{formatTime(player.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
