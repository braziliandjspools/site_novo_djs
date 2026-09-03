"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Lock,
  MonitorDown,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { ensureAudioExtension, type PreviewTrack } from "../../lib/google-drive";
import { sendTrackToDownloader, sendTracksToDownloaderBatch } from "../lib/send-to-downloader";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { TrackDownloadStatus } from "./TrackDownloadStatus";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { recordContinueFromTrack } from "../lib/music-library-storage";
import { slugifyFolderName } from "../../lib/vip-music-slugs";

type VipMusicTrackListProps = {
  folderId: string;
  tracks: PreviewTrack[];
  canPlay: boolean;
  canDownload: boolean;
  relativePath?: string;
  highlightTrackId?: string;
  autoPlayTrackId?: string;
  continueContext?: {
    styleName: string;
    monthName: string;
    monthSlug: string;
  };
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function downloadUrl(track: PreviewTrack) {
  const name = encodeURIComponent(ensureAudioExtension(track.fileName ?? track.title));
  return `/api/musicas/download/${track.id}?name=${name}`;
}

function resolveDownloadFilename(track: PreviewTrack) {
  return ensureAudioExtension(track.fileName ?? track.title);
}

async function triggerDownload(track: PreviewTrack) {
  const filename = resolveDownloadFilename(track);
  const response = await fetch(downloadUrl(track));
  if (!response.ok) {
    throw new Error("Não foi possível baixar a faixa.");
  }

  const blob = await response.blob();
  if (blob.type.includes("json") || blob.size < 256) {
    throw new Error("Arquivo indisponível no Drive.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function PlayingBars() {
  return (
    <span className="inline-flex h-2.5 items-end gap-px" aria-hidden>
      {[3, 5, 4].map((h, i) => (
        <span
          key={i}
          className="w-px animate-pulse rounded-full bg-zinc-400"
          style={{ height: h, animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

type TrackRowProps = {
  track: PreviewTrack;
  index: number;
  canPlay: boolean;
  canDownload: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  isActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isBusy: boolean;
  isHighlighted: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  hasPrev: boolean;
  hasNext: boolean;
  onToggle: () => void;
  onSeek: (ratio: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  onSendToDownloader: () => void;
  isSendingToDownloader: boolean;
  onToggleSelected: () => void;
};

function TrackRow({
  track,
  index,
  canPlay,
  canDownload,
  selectionMode,
  isSelected,
  isActive,
  isPlaying,
  isLoading,
  isBusy,
  isHighlighted,
  progress,
  currentTime,
  duration,
  hasPrev,
  hasNext,
  onToggle,
  onSeek,
  onPrev,
  onNext,
  onDownload,
  isDownloading,
  onSendToDownloader,
  isSendingToDownloader,
  onToggleSelected,
}: TrackRowProps) {
  return (
    <article
      id={isHighlighted ? `track-${track.id}` : undefined}
      className={`rounded-md border transition-colors ${
        isHighlighted
          ? "border-[#FFDF00]/40 bg-[#FFDF00]/5"
          : isSelected
            ? "border-[#1ed760]/30 bg-[#1ed760]/5"
            : isActive
              ? "border-zinc-700 bg-white/[0.04]"
              : "border-transparent hover:border-zinc-800 hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-1.5 px-1.5 py-1">
        {selectionMode && canDownload ? (
          <button
            type="button"
            onClick={onToggleSelected}
            aria-label={isSelected ? `Remover ${track.title} da seleção` : `Selecionar ${track.title}`}
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
              isSelected
                ? "border-[#1ed760] bg-[#1ed760] text-black"
                : "border-zinc-600 bg-transparent text-transparent hover:border-zinc-400"
            }`}
          >
            {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0 text-center font-mono text-[9px] text-zinc-600">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        {canPlay ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={isBusy || selectionMode}
            aria-label={isPlaying ? `Pausar ${track.title}` : `Ouvir ${track.title}`}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              isPlaying
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            } ${selectionMode ? "opacity-60" : ""}`}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-3 w-3" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-3 w-3" fill="currentColor" />
            )}
          </button>
        ) : (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
            <Lock className="h-2.5 w-2.5" />
          </div>
        )}

        <button
          type="button"
          onClick={selectionMode && canDownload ? onToggleSelected : canPlay ? onToggle : undefined}
          disabled={!canPlay && !selectionMode}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-1.5">
            {isPlaying && <PlayingBars />}
            <p className={`truncate text-xs font-medium leading-tight ${isActive ? "text-white" : "text-zinc-300"}`}>
              {track.title}
            </p>
            <TrackDownloadStatus fileId={track.id} />
          </div>
          {track.artist && track.artist !== "Unknown Artist" && (
            <p className="truncate text-[10px] leading-tight text-zinc-500">{track.artist}</p>
          )}
        </button>

        {isActive && duration > 0 && !selectionMode && (
          <span className="hidden flex-shrink-0 font-mono text-[9px] tabular-nums text-zinc-500 sm:inline">
            {formatTime(currentTime)}
          </span>
        )}

        {isActive && canPlay && !selectionMode && (
          <div className="flex flex-shrink-0 items-center">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className="flex h-6 w-6 items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="flex h-6 w-6 items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30"
              aria-label="Próxima"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {canDownload && !selectionMode ? (
          <>
            <button
              type="button"
              onClick={onSendToDownloader}
              disabled={isSendingToDownloader}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-[#1ed760] disabled:opacity-50"
              title="Enviar para o Downloader"
              aria-label={`Enviar ${track.title} para o Downloader`}
            >
              {isSendingToDownloader ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MonitorDown className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-zinc-200 disabled:opacity-50"
              title={`Baixar ${resolveDownloadFilename(track)}`}
              aria-label={`Baixar ${track.title}`}
            >
              {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </button>
          </>
        ) : !canDownload ? (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-zinc-700">
            <Lock className="h-3 w-3" />
          </div>
        ) : null}
      </div>

      {isActive && canPlay && !selectionMode && (
        <div className="flex items-center gap-2 px-1.5 pb-1.5 pl-9">
          <div
            role="slider"
            tabIndex={0}
            aria-label="Progresso"
            className="h-3 flex-1 cursor-pointer py-1"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSeek((e.clientX - rect.left) / rect.width);
            }}
          >
            <div className="h-0.5 rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${isPlaying ? "bg-zinc-300" : "bg-zinc-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="flex-shrink-0 font-mono text-[9px] tabular-nums text-zinc-500">
            {duration > 0 ? formatTime(duration) : ""}
          </span>
        </div>
      )}
    </article>
  );
}

export function VipMusicTrackList({
  folderId,
  tracks,
  canPlay,
  canDownload,
  relativePath,
  highlightTrackId,
  autoPlayTrackId,
  continueContext,
}: VipMusicTrackListProps) {
  const { authenticated, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const {
    playingFolderId,
    playingId,
    loadingId,
    currentTime,
    duration,
    progress,
    error,
    toggleTrack,
    seek,
  } = useVipMusicPlayer();

  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(highlightTrackId ?? null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const autoPlayedRef = useRef<string | null>(null);
  const isThisFolder = playingFolderId === folderId;
  const isGlobalBusy = loadingId !== null;

  const activeId = isThisFolder ? (playingId ?? focusedTrackId ?? loadingId) : focusedTrackId;
  const selectedCount = selectedIds.size;

  const handleToggle = useCallback(
    async (id: string) => {
      if (!canPlay || selectionMode) return;
      setFocusedTrackId(id);
      const track = tracks.find((item) => item.id === id);
      if (track && continueContext) {
        const styleSlug = slugifyFolderName(continueContext.styleName);
        recordContinueFromTrack({
          ...track,
          styleFolderId: folderId,
          styleName: continueContext.styleName,
          monthName: continueContext.monthName,
          href: `/musicas/atualizacoes/${continueContext.monthSlug}?estilo=${encodeURIComponent(styleSlug)}&faixa=${encodeURIComponent(id)}`,
        });
      }
      await toggleTrack(folderId, id);
    },
    [canPlay, continueContext, folderId, selectionMode, toggleTrack, tracks],
  );

  const handleSeek = useCallback(
    async (ratio: number) => {
      if (!canPlay || !activeId || !isThisFolder || selectionMode) return;
      if (playingId !== activeId) {
        await handleToggle(activeId);
      }
      await seek(ratio);
    },
    [activeId, canPlay, handleToggle, isThisFolder, playingId, seek, selectionMode],
  );

  const playAtIndex = useCallback(
    (index: number) => {
      const track = tracks[index];
      if (track) void handleToggle(track.id);
    },
    [handleToggle, tracks],
  );

  const handleDownload = useCallback(
    async (track: PreviewTrack) => {
      if (downloadingId) return;
      setDownloadingId(track.id);
      try {
        await triggerDownload(track);
      } catch {
        window.alert("Não foi possível baixar a faixa. Tente novamente.");
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId],
  );

  const ensureDownloaderAccess = useCallback(() => {
    if (!authenticated) {
      openLogin();
      return false;
    }
    if (!canDownload) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return false;
    }
    return true;
  }, [authenticated, canDownload, openLogin, showToast]);

  const handleSendToDownloader = useCallback(
    async (track: PreviewTrack) => {
      if (sendingId || batchSending) return;
      if (!ensureDownloaderAccess()) return;

      setSendingId(track.id);
      try {
        await sendTrackToDownloader(track, {
          relativePath,
          target: sync?.selectedTarget,
          devices: sync?.devices,
        });
        showToast("Adicionado ao BRS Downloader");
        await sync?.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Não foi possível enviar para o Downloader.", "error");
      } finally {
        setSendingId(null);
      }
    },
    [batchSending, ensureDownloaderAccess, relativePath, sendingId, showToast, sync, tracks],
  );

  const handleSendSelectedToDownloader = useCallback(async () => {
    if (batchSending || sendingId || selectedCount === 0) return;
    if (!ensureDownloaderAccess()) return;

    const selectedTracks = tracks.filter((track) => selectedIds.has(track.id));
    if (selectedTracks.length === 0) return;

    setBatchSending(true);
    try {
      const result = await sendTracksToDownloaderBatch(selectedTracks, {
        relativePath,
        target: sync?.selectedTarget,
        devices: sync?.devices,
      });
      const count = result.count;
      showToast(
        count === 1
          ? "Adicionado ao BRS Downloader"
          : `${count} faixas adicionadas ao BRS Downloader`,
      );
      await sync?.refresh();
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível enviar para o Downloader.", "error");
    } finally {
      setBatchSending(false);
    }
  }, [
    batchSending,
    ensureDownloaderAccess,
    relativePath,
    selectedCount,
    selectedIds,
    sendingId,
    showToast,
    sync,
    tracks,
  ]);

  const toggleTrackSelected = useCallback((trackId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const selectAllTracks = useCallback(() => {
    setSelectedIds(new Set(tracks.map((track) => track.id)));
  }, [tracks]);

  useEffect(() => {
    if (highlightTrackId) setFocusedTrackId(highlightTrackId);
  }, [highlightTrackId]);

  useEffect(() => {
    if (!autoPlayTrackId || !canPlay || selectionMode) return;
    if (!tracks.some((track) => track.id === autoPlayTrackId)) return;
    if (autoPlayedRef.current === autoPlayTrackId) return;
    autoPlayedRef.current = autoPlayTrackId;
    void handleToggle(autoPlayTrackId);
  }, [autoPlayTrackId, canPlay, handleToggle, selectionMode, tracks]);

  useEffect(() => {
    setSelectedIds((current) => {
      const validIds = new Set(tracks.map((track) => track.id));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [tracks]);

  const selectionLabel = useMemo(() => {
    if (selectedCount === 0) return "Enviar para o Downloader";
    if (selectedCount === 1) return "Enviar 1 para o Downloader";
    return `Enviar ${selectedCount} para o Downloader`;
  }, [selectedCount]);

  if (tracks.length === 0) return null;

  return (
    <div>
      {error && isThisFolder && (
        <p className="mb-1 rounded-md bg-red-500/10 px-2 py-1 text-center text-[10px] text-red-400">{error}</p>
      )}

      {canDownload && tracks.length > 1 && (
        <div className="mb-1 flex flex-wrap items-center gap-1.5 border-b border-zinc-800/80 px-1.5 py-1.5">
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={selectAllTracks}
                className="rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedCount === 0}
                className="rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={exitSelectionMode}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
              >
                <Square className="h-3 w-3" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSendSelectedToDownloader()}
                disabled={selectedCount === 0 || batchSending}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[#1ed760] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {batchSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MonitorDown className="h-3 w-3" />}
                {selectionLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSelectionMode(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:bg-white/5 hover:text-[#1ed760]"
            >
              <Check className="h-3 w-3" />
              Selecionar faixas
            </button>
          )}
        </div>
      )}

      <div className="space-y-px">
        {tracks.map((track, index) => {
          const isActive = activeId === track.id;
          const isPlaying = isThisFolder && playingId === track.id;
          const isLoading = isThisFolder && loadingId === track.id;
          return (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              canPlay={canPlay}
              canDownload={canDownload}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(track.id)}
              isActive={isActive}
              isPlaying={isPlaying}
              isLoading={isLoading}
              isBusy={isGlobalBusy && loadingId !== track.id}
              isHighlighted={highlightTrackId === track.id}
              progress={isActive && isThisFolder ? progress : 0}
              currentTime={isActive && isThisFolder ? currentTime : 0}
              duration={isActive && isThisFolder ? duration : 0}
              hasPrev={index > 0}
              hasNext={index < tracks.length - 1}
              onToggle={() => void handleToggle(track.id)}
              onSeek={(ratio) => void handleSeek(ratio)}
              onPrev={() => playAtIndex(index - 1)}
              onNext={() => playAtIndex(index + 1)}
              onDownload={() => void handleDownload(track)}
              isDownloading={downloadingId === track.id}
              onSendToDownloader={() => void handleSendToDownloader(track)}
              isSendingToDownloader={sendingId === track.id}
              onToggleSelected={() => toggleTrackSelected(track.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

