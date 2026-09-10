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
import { folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
import { poolPanelClass, poolRowTone, poolTableHeadClass } from "./atualizacoes-pool-ui";

type VipMusicTrackListProps = {
  folderId: string;
  tracks: PreviewTrack[];
  canPlay: boolean;
  canDownload: boolean;
  relativePath?: string;
  /** Capa da pasta para Media Session / notificação. */
  coverUrl?: string | null;
  /** Nome do álbum/coleção na notificação. */
  albumTitle?: string | null;
  highlightTrackId?: string;
  autoPlayTrackId?: string;
  continueContext?: {
    styleName: string;
    monthName: string;
    monthSlug: string;
    weekSlug?: string;
  };
  /** `table` = Atualizações desktop; `discography` = coleções estilo Spotify. */
  layout?: "default" | "table" | "discography";
  hasMore?: boolean;
  onLoadMore?: () => Promise<{ tracks: PreviewTrack[]; hasMore: boolean } | null | undefined | void>;
};

/** Colunas fixas: # | nome | Key | BPM | ações — Key/BPM não deslocam no play. */
const TABLE_GRID =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_2.75rem_3.75rem_5.5rem] items-center gap-x-3";

/** Discografia Spotify: # | título/artista | duração */
const DISCOGRAPHY_GRID = "grid grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-x-3 sm:gap-x-4";

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
  /** Quando false, não define id no DOM (evita duplicata mobile/desktop). */
  setDomAnchor?: boolean;
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
  setDomAnchor = true,
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
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
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
      <div className="flex min-w-0 items-center gap-1.5 px-1.5 py-1">
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
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {isPlaying && <PlayingBars />}
              <p
                className={`min-w-0 break-words text-xs font-medium leading-tight ${isActive ? "text-white" : "text-zinc-300"}`}
                title={track.title}
              >
                {track.title}
              </p>
              <span className="hidden sm:inline">
                <TrackDownloadStatus fileId={track.id} />
              </span>
            </div>
            {track.artist ? (
              <p className="mt-0.5 truncate text-[10px] text-zinc-500" title={track.artist}>
                {track.artist}
                {track.album ? ` · ${track.album}` : ""}
              </p>
            ) : track.album ? (
              <p className="mt-0.5 truncate text-[10px] text-zinc-500" title={track.album}>
                {track.album}
              </p>
            ) : null}
          </div>
        </button>

        {isActive && duration > 0 && !selectionMode && (
          <span className="hidden flex-shrink-0 font-mono text-[9px] tabular-nums text-zinc-500 sm:inline">
            {formatTime(currentTime)}
          </span>
        )}

        {isActive && canPlay && !selectionMode && (
          <div className="hidden flex-shrink-0 items-center sm:flex">
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

        {/* Desktop: ícones na mesma linha */}
        {canDownload && !selectionMode ? (
          <div className="hidden flex-shrink-0 items-center gap-0.5 sm:flex">
            <button
              type="button"
              onClick={onSendToDownloader}
              disabled={isSendingToDownloader}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-[#1ed760] disabled:opacity-50"
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
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-zinc-200 disabled:opacity-50"
              title={`Baixar ${resolveDownloadFilename(track)}`}
              aria-label={`Baixar ${track.title}`}
            >
              {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : !canDownload ? (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-zinc-700">
            <Lock className="h-3 w-3" />
          </div>
        ) : null}
      </div>

      {/* Mobile: ações sempre visíveis, linha própria — não corta / não some */}
      {canDownload && !selectionMode ? (
        <div className="flex items-center gap-2 px-1.5 pb-1.5 pl-9 sm:hidden">
          <button
            type="button"
            onClick={onSendToDownloader}
            disabled={isSendingToDownloader}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#1ed760]/35 bg-[#1ed760]/10 px-2 py-1.5 text-[11px] font-bold text-[#1ed760] disabled:opacity-50"
            aria-label={`Enviar ${track.title} para o Downloader`}
          >
            {isSendingToDownloader ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MonitorDown className="h-3.5 w-3.5" />
            )}
            Downloader
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-[11px] font-bold text-zinc-200 disabled:opacity-50"
            aria-label={`Baixar ${track.title}`}
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Baixar
          </button>
        </div>
      ) : null}

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

function DiscographyTrackRow({
  track,
  index,
  canPlay,
  isActive,
  isPlaying,
  isLoading,
  isBusy,
  isHighlighted,
  setDomAnchor = true,
  duration,
  onToggle,
}: TrackRowProps) {
  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`group/row rounded-md transition-colors hover:bg-white/[0.06] ${
        isActive || isPlaying ? "bg-white/[0.04]" : ""
      }`}
    >
      <button
        type="button"
        onClick={canPlay ? onToggle : undefined}
        disabled={!canPlay || isBusy}
        className={`${DISCOGRAPHY_GRID} w-full px-2 py-2.5 text-left sm:px-3`}
      >
        <div className="flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
          ) : isPlaying ? (
            <PlayingBars />
          ) : (
            <>
              <span className="font-mono text-[13px] tabular-nums text-zinc-500 group-hover/row:hidden">
                {index + 1}
              </span>
              {canPlay ? (
                <Play className="ml-0.5 hidden h-3.5 w-3.5 fill-white text-white group-hover/row:block" />
              ) : (
                <Lock className="hidden h-3.5 w-3.5 text-zinc-500 group-hover/row:block" />
              )}
            </>
          )}
        </div>

        <div className="min-w-0">
          <p
            className={`truncate text-sm font-semibold ${
              isPlaying || isActive ? "text-[#1ed760]" : "text-white"
            }`}
          >
            {track.title}
          </p>
          {track.artist ? (
            <p className="mt-0.5 truncate text-xs text-zinc-400" title={track.artist}>
              {track.artist}
              {track.album ? ` · ${track.album}` : ""}
            </p>
          ) : track.album ? (
            <p className="mt-0.5 truncate text-xs text-zinc-400" title={track.album}>
              {track.album}
            </p>
          ) : null}
        </div>

        <div className="text-right font-mono text-xs tabular-nums text-zinc-500">
          {isActive && duration > 0 ? formatTime(duration) : "—:—"}
        </div>
      </button>
    </article>
  );
}

type TrackTableRowProps = TrackRowProps;

function TrackTableRow({
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
  setDomAnchor = true,
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
}: TrackTableRowProps) {
  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`group/row relative transition-colors ${
        isHighlighted
          ? "bg-[#FFDF00]/10"
          : isSelected
            ? "bg-[#1ed760]/10"
            : poolRowTone(index, isActive)
      }`}
    >
      <div className={`${TABLE_GRID} border-b border-zinc-800/80 px-3 py-2.5 last:border-b-0 sm:px-4`}>
        {/* Index / select */}
        <div className="flex items-center justify-center">
          {selectionMode && canDownload ? (
            <button
              type="button"
              onClick={onToggleSelected}
              aria-label={isSelected ? `Remover ${track.title} da seleção` : `Selecionar ${track.title}`}
              className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                isSelected
                  ? "border-[#1ed760] bg-[#1ed760] text-black"
                  : "border-zinc-600 bg-transparent text-transparent hover:border-zinc-400"
              }`}
            >
              {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </button>
          ) : isPlaying ? (
            <PlayingBars />
          ) : (
            <span
              className={`font-mono text-[11px] tabular-nums ${
                isActive ? "text-white" : "text-zinc-600 group-hover/row:text-zinc-400"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Title + play */}
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          {canPlay ? (
            <button
              type="button"
              onClick={onToggle}
              disabled={isBusy || selectionMode}
              aria-label={isPlaying ? `Pausar ${track.title}` : `Ouvir ${track.title}`}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                isPlaying
                  ? "bg-[#1ed760] text-black shadow-lg shadow-[#1ed760]/25"
                  : "bg-white/10 text-white hover:bg-[#1ed760] hover:text-black"
              } ${selectionMode ? "opacity-60" : ""}`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              )}
            </button>
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-500 ring-1 ring-white/10">
              <Lock className="h-3.5 w-3.5" />
            </div>
          )}
          <button
            type="button"
            onClick={selectionMode && canDownload ? onToggleSelected : canPlay ? onToggle : undefined}
            disabled={!canPlay && !selectionMode}
            className="min-w-0 flex-1 overflow-hidden text-left"
          >
            <p
              className={`truncate text-sm font-medium leading-snug ${
                isActive || isPlaying ? "text-[#1ed760]" : "text-white"
              }`}
              title={track.title}
            >
              {track.title}
            </p>
            {track.artist ? (
              <p className="mt-0.5 truncate text-[11px] text-zinc-500" title={track.artist}>
                {track.artist}
                {track.album ? ` · ${track.album}` : ""}
              </p>
            ) : track.album ? (
              <p className="mt-0.5 truncate text-[11px] text-zinc-500" title={track.album}>
                {track.album}
              </p>
            ) : null}
          </button>
        </div>

        {/* Key Camelot — antes do BPM */}
        <p className="text-center font-mono text-xs tabular-nums text-zinc-400">
          {track.musicalKey ?? "—"}
        </p>

        {/* BPM — coluna de largura fixa no grid */}
        <p className="text-center font-mono text-xs tabular-nums text-zinc-400">
          {track.bpm ?? "—"}
        </p>

        {/* Actions — largura reservada no grid; prev/next ficam na barra de progresso */}
        <div className="flex items-center justify-end gap-1">
          <TrackDownloadStatus fileId={track.id} />

          {canDownload && !selectionMode ? (
            <>
              <button
                type="button"
                onClick={onSendToDownloader}
                disabled={isSendingToDownloader}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-[#1ed760] disabled:opacity-50"
                title="Enviar para o Downloader"
                aria-label={`Enviar ${track.title} para o Downloader`}
              >
                {isSendingToDownloader ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MonitorDown className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onDownload}
                disabled={isDownloading}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-zinc-200 disabled:opacity-50"
                title={`Baixar ${resolveDownloadFilename(track)}`}
                aria-label={`Baixar ${track.title}`}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
            </>
          ) : !canDownload ? (
            <div className="flex h-8 w-8 items-center justify-center text-zinc-700">
              <Lock className="h-3.5 w-3.5" />
            </div>
          ) : null}
        </div>
      </div>

      {isActive && canPlay && !selectionMode && (
        <div className="flex items-center gap-2 border-t border-zinc-800/50 px-3 pb-2.5 pt-1.5 pl-[calc(2.25rem+0.75rem+2.25rem)] sm:px-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div
              role="slider"
              tabIndex={0}
              aria-label="Progresso"
              className="h-3 cursor-pointer py-1"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onSeek((e.clientX - rect.left) / rect.width);
              }}
            >
              <div className="h-1 rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full ${isPlaying ? "bg-[#1ed760]" : "bg-zinc-500"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {duration > 0 && (
              <p className="mt-0.5 font-mono text-[10px] tabular-nums text-zinc-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Próxima"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
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
  coverUrl,
  albumTitle,
  highlightTrackId,
  autoPlayTrackId,
  continueContext,
  layout = "default",
  hasMore = false,
  onLoadMore,
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
    setFolderPlayback,
  } = useVipMusicPlayer();

  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(highlightTrackId ?? null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isDesktop, setIsDesktop] = useState(false);
  const autoPlayedRef = useRef<string | null>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;
  const isThisFolder = playingFolderId === folderId;
  const isGlobalBusy = loadingId !== null;

  useEffect(() => {
    setFolderPlayback(folderId, {
      tracks,
      hasMore,
      loadMore: async () => loadMoreRef.current?.(),
      coverUrl: coverUrl ?? null,
      albumTitle: albumTitle ?? tracks[0]?.pack ?? null,
    });
  }, [folderId, tracks, hasMore, setFolderPlayback, coverUrl, albumTitle]);

  useEffect(() => {
    if (layout !== "table") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const syncMq = () => setIsDesktop(mq.matches);
    syncMq();
    mq.addEventListener("change", syncMq);
    return () => mq.removeEventListener("change", syncMq);
  }, [layout]);

  const activeId = isThisFolder ? (playingId ?? focusedTrackId ?? loadingId) : focusedTrackId;
  const selectedCount = selectedIds.size;

  const handleToggle = useCallback(
    async (id: string) => {
      if (!canPlay || selectionMode) return;
      setFocusedTrackId(id);
      const track = tracks.find((item) => item.id === id);
      if (track && continueContext) {
        const styleSlug = slugifyFolderName(continueContext.styleName);
        const segments = [continueContext.monthSlug];
        if (continueContext.weekSlug) segments.push(continueContext.weekSlug);
        segments.push(styleSlug);
        const params = new URLSearchParams({ faixa: id });
        recordContinueFromTrack({
          ...track,
          styleFolderId: folderId,
          styleName: continueContext.styleName,
          monthName: continueContext.monthName,
          href: `${folderHref(segments)}?${params.toString()}`,
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
        showToast("Não foi possível baixar a faixa. Tente novamente.", "error");
      } finally {
        setDownloadingId(null);
      }
    },
    [downloadingId, showToast],
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

  const useTable = layout === "table";
  const useDiscography = layout === "discography";

  const rowPropsFor = (track: PreviewTrack, index: number) => {
    const isActive = activeId === track.id;
    const isPlaying = isThisFolder && playingId === track.id;
    const isLoading = isThisFolder && loadingId === track.id;
    return {
      track,
      index,
      canPlay,
      canDownload,
      selectionMode,
      isSelected: selectedIds.has(track.id),
      isActive,
      isPlaying,
      isLoading,
      isBusy: isGlobalBusy && loadingId !== track.id,
      isHighlighted: highlightTrackId === track.id,
      progress: isActive && isThisFolder ? progress : 0,
      currentTime: isActive && isThisFolder ? currentTime : 0,
      duration: isActive && isThisFolder ? duration : 0,
      hasPrev: index > 0,
      hasNext: index < tracks.length - 1,
      onToggle: () => void handleToggle(track.id),
      onSeek: (ratio: number) => void handleSeek(ratio),
      onPrev: () => playAtIndex(index - 1),
      onNext: () => playAtIndex(index + 1),
      onDownload: () => void handleDownload(track),
      isDownloading: downloadingId === track.id,
      onSendToDownloader: () => void handleSendToDownloader(track),
      isSendingToDownloader: sendingId === track.id,
      onToggleSelected: () => toggleTrackSelected(track.id),
    };
  };

  return (
    <div>
      {error && isThisFolder && (
        <p className="mb-1 rounded-md bg-red-500/10 px-2 py-1 text-center text-[10px] text-red-400">{error}</p>
      )}

      {canDownload && tracks.length > 1 && !useDiscography && (
        <div
          className={`mb-1 flex flex-wrap items-center gap-1.5 px-1.5 py-1.5 ${
            useTable
              ? "border-b border-white/[0.06] md:px-3 md:py-2.5"
              : "border-b border-zinc-800/80"
          }`}
        >
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
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#1ed760] px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90 disabled:opacity-40 sm:ml-auto sm:w-auto sm:py-1"
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

      {useDiscography ? (
        <div>
          <div
            className={`${DISCOGRAPHY_GRID} border-b border-white/[0.08] px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 sm:px-3`}
          >
            <span className="text-center">#</span>
            <span>Título</span>
            <span className="flex justify-end" aria-label="Duração">
              <span className="sr-only">Duração</span>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8.75-3.75a.75.75 0 0 0-1.5 0v3.5c0 .192.168.1.5.75H11a.75.75 0 0 0 0-1.5H8.75V4.25z" />
              </svg>
            </span>
          </div>
          <div className="mt-1">
            {tracks.map((track, index) => (
              <DiscographyTrackRow key={track.id} {...rowPropsFor(track, index)} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile (and default layout): stacked TrackRow */}
          <div className={useTable ? "space-y-px md:hidden" : "space-y-px"}>
            {tracks.map((track, index) => (
              <TrackRow
                key={track.id}
                {...rowPropsFor(track, index)}
                setDomAnchor={!useTable || !isDesktop}
              />
            ))}
          </div>

          {/* Desktop table — Atualizações only */}
          {useTable && (
            <div className={`hidden md:block ${poolPanelClass}`}>
              <div className={`${poolTableHeadClass} ${TABLE_GRID}`}>
                <span className="text-center">#</span>
                <span className="min-w-0">Nome</span>
                <span className="text-center">Key</span>
                <span className="text-center">BPM</span>
                <span className="text-right">Ações</span>
              </div>
              <div>
                {tracks.map((track, index) => (
                  <TrackTableRow
                    key={track.id}
                    {...rowPropsFor(track, index)}
                    setDomAnchor={isDesktop}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

