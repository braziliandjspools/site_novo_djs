"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, FolderOpen, Headphones, Loader2, Pause, Play, Volume2 } from "lucide-react";
import { useProtectedPlayer } from "../hooks/useProtectedPlayer";
import type { PreviewPlaylist, PreviewTrack } from "../lib/google-drive";
import { PLACEHOLDER } from "../lib/theme";
import { SiteImage } from "./SiteImage";

type MusicProducerDemoPlayerProps = {
  initialPlaylists?: PreviewPlaylist[];
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type ProgressBarProps = {
  progress: number;
  isActive: boolean;
  onSeek: (ratio: number) => void;
};

function ProgressBar({ progress, isActive, onSeek }: ProgressBarProps) {
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Progresso da faixa"
      aria-valuenow={Math.round(progress)}
      className="group/progress h-1.5 w-full cursor-pointer rounded-full bg-[#3a3a3a] transition-all hover:h-2"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - rect.left) / rect.width);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek((progress + 2) / 100);
        if (e.key === "ArrowLeft") onSeek(Math.max(0, (progress - 2) / 100));
      }}
    >
      <div
        className={`h-full rounded-full transition-all ${isActive ? "bg-[#ff5500]" : "bg-[#ff5500]/70"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

type TrackRowProps = {
  track: PreviewTrack;
  category: string;
  isFocused: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isBusy: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (ratio: number) => void;
};

function TrackRow({
  track,
  category,
  isFocused,
  isPlaying,
  isLoading,
  isBusy,
  progress,
  currentTime,
  duration,
  onToggle,
  onSeek,
}: TrackRowProps) {
  return (
    <article
      className={`group rounded-lg border px-3 py-2.5 transition-all sm:px-3.5 ${
        isFocused
          ? "border-[#ff5500]/40 bg-[#282828]"
          : "border-white/5 bg-[#1e1e1e] hover:border-white/10 hover:bg-[#252525]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="relative h-12 w-12 overflow-hidden rounded-md bg-[#121212] sm:h-14 sm:w-14">
            <SiteImage
              src={PLACEHOLDER.demoCover}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
            <button
              type="button"
              onClick={onToggle}
              disabled={isBusy}
              aria-label={isPlaying ? `Pausar ${track.title}` : `Ouvir ${track.title}`}
              className={`absolute inset-0 z-20 flex items-center justify-center bg-black/45 transition-opacity ${
                isPlaying || isLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff5500] text-white shadow-md">
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-3.5 w-3.5" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggle}
              disabled={isBusy}
              className="min-w-0 truncate text-left text-sm font-semibold text-white transition-colors hover:text-[#ff5500] sm:text-[15px]"
            >
              {track.title}
            </button>
            <span className="flex-shrink-0 font-mono text-[10px] text-[#999999] sm:text-[11px]">
              {isFocused && duration > 0 ? formatTime(duration) : "—:—"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[#888888]">
            BRS · {category}
          </p>
        </div>
      </div>

      <div className="mt-2.5 pl-[60px] sm:pl-[68px]">
        <ProgressBar progress={isFocused ? progress : 0} isActive={isPlaying} onSeek={onSeek} />
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#666666]">
          <span className="inline-flex items-center gap-1">
            <Headphones className="h-2.5 w-2.5" />
            Demo
          </span>
          {isFocused && (
            <span className="font-mono text-[#999999]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function MusicProducerDemoPlayer({ initialPlaylists = [] }: MusicProducerDemoPlayerProps) {
  const [playlists, setPlaylists] = useState<PreviewPlaylist[]>(initialPlaylists);
  const [loading, setLoading] = useState(initialPlaylists.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set());
  const player = useProtectedPlayer();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/music-producer/demos", { cache: "no-store" });
        const data = (await res.json()) as { playlists?: PreviewPlaylist[]; error?: string };
        if (cancelled) return;
        if (data.playlists?.length) {
          setPlaylists(data.playlists);
          setError(null);
        } else if (data.error) {
          setError(data.error);
        } else if (!initialPlaylists.length) {
          setError("Nenhuma pasta com demos encontrada.");
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar as demos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialPlaylists.length]);

  const allTracks = useMemo(() => playlists.flatMap((p) => p.tracks), [playlists]);
  const isGlobalBusy = player.loadingId !== null;
  const totalDemos = allTracks.length;

  const handleToggle = useCallback(
    async (id: string) => {
      setFocusedTrackId(id);
      await player.toggle(id);
    },
    [player],
  );

  const handleSeek = useCallback(
    async (trackId: string, ratio: number) => {
      if (focusedTrackId !== trackId) {
        await handleToggle(trackId);
      }
      await player.seek(ratio);
    },
    [focusedTrackId, handleToggle, player],
  );

  const toggleFolder = useCallback(
    (folderId: string) => {
      setOpenFolders((prev) => {
        if (!prev.has(folderId)) {
          const next = new Set(prev);
          next.add(folderId);
          return next;
        }

        const playlist = playlists.find((p) => p.id === folderId);
        if (playlist?.tracks.some((t) => t.id === player.playingId)) {
          player.pause();
        }

        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    },
    [playlists, player],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-[#1e1e1e] py-12 text-sm text-[#b3b3b3]">
        <Loader2 className="h-4 w-4 animate-spin text-[#ff5500]" />
        Carregando demos...
      </div>
    );
  }

  if (!playlists.length) {
    return (
      <p className="py-8 text-center text-sm text-[#727272]">
        {error ?? player.error ?? "Nenhuma demo encontrada na pasta do Google Drive."}
      </p>
    );
  }

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="flex items-center justify-center gap-3 rounded-lg border border-[#ff5500]/20 bg-[#181818] px-4 py-3 text-center sm:justify-start sm:text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5500]/20">
          <Volume2 className="h-4 w-4 text-[#ff5500]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{totalDemos} demonstrações</p>
          <p className="text-xs text-[#999999]">
            {playlists.length} {playlists.length === 1 ? "pasta" : "pastas"} · clique na barra para avançar
          </p>
        </div>
      </div>

      {(player.error || error) && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">{player.error ?? error}</p>
      )}

      <div className="space-y-2">
        {playlists.map((playlist) => {
          const isOpen = openFolders.has(playlist.id);
          const activeTrack = playlist.tracks.find((t) => t.id === focusedTrackId);
          const hasPausedTrack = !isOpen && activeTrack != null;
          return (
            <div
              key={playlist.id}
              className={`overflow-hidden rounded-lg border bg-[#1a1a1a] transition-colors ${
                hasPausedTrack ? "border-[#ff5500]/35 bg-[#201a17]" : "border-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFolder(playlist.id)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors sm:px-4 ${
                  hasPausedTrack ? "hover:bg-[#2a221e]" : "hover:bg-[#252525]"
                }`}
              >
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-[#ff5500] transition-transform duration-200 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
                {hasPausedTrack ? (
                  <Pause className="h-4 w-4 flex-shrink-0 text-[#ff5500]" fill="currentColor" />
                ) : (
                  <FolderOpen className="h-4 w-4 flex-shrink-0 text-[#999999]" />
                )}
                <span className="min-w-0 flex-1 truncate font-display text-base tracking-wide text-white">
                  {playlist.name}
                </span>
                {hasPausedTrack && (
                  <span className="min-w-0 max-w-[45%] truncate text-xs text-[#ff5500]">{activeTrack.title}</span>
                )}
                <span className="flex-shrink-0 rounded-full bg-[#333333] px-2 py-0.5 text-[10px] text-[#999999]">
                  {playlist.tracks.length} {playlist.tracks.length === 1 ? "faixa" : "faixas"}
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
                aria-hidden={!isOpen}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-2 border-t border-white/5 p-2 sm:p-2.5">
                    {playlist.tracks.map((track) => {
                      const isFocused = focusedTrackId === track.id;
                      return (
                        <TrackRow
                          key={track.id}
                          track={track}
                          category={playlist.name}
                          isFocused={isFocused}
                          isPlaying={player.playingId === track.id}
                          isLoading={player.loadingId === track.id}
                          isBusy={isGlobalBusy && player.loadingId !== track.id}
                          progress={isFocused ? player.progress : 0}
                          currentTime={isFocused ? player.currentTime : 0}
                          duration={isFocused ? player.duration : 0}
                          onToggle={() => void handleToggle(track.id)}
                          onSeek={(ratio) => void handleSeek(track.id, ratio)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
