"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  Check,
  Copy,
  Download,
  ListPlus,
  Loader2,
  Lock,
  MonitorDown,
  Pause,
  Play,
  Share2,
  Square,
} from "lucide-react";
import { ensureAudioExtension, type PreviewTrack } from "../../lib/google-drive";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import { sendTrackToDownloader, sendTracksToDownloaderBatch } from "../lib/send-to-downloader";
import { getTrackDownloadLabel } from "../lib/downloader-sync";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { recordContinueFromTrack } from "../lib/music-library-storage";
import { folderHref, slugifyFolderName } from "../../lib/vip-music-slugs";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";

type VipMusicTrackListProps = {
  folderId: string;
  tracks: PreviewTrack[];
  canPlay: boolean;
  canDownload: boolean;
  relativePath?: string;
  coverUrl?: string | null;
  albumTitle?: string | null;
  highlightTrackId?: string;
  autoPlayTrackId?: string;
  continueContext?: {
    styleName: string;
    monthName: string;
    monthSlug: string;
    weekSlug?: string;
  };
  /** `table` = Atualizações streaming; `discography` = coleções. */
  layout?: "default" | "table" | "discography";
  embedded?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => Promise<{ tracks: PreviewTrack[]; hasMore: boolean } | null | undefined | void>;
};

const STREAM_DESKTOP_GRID =
  "hidden md:grid md:grid-cols-[44px_minmax(0,1fr)_70px_48px_32px] md:items-center md:gap-x-2";

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

async function triggerDownload(track: PreviewTrack) {
  const filename = ensureAudioExtension(track.fileName ?? track.title);
  const response = await fetch(downloadUrl(track));
  if (!response.ok) throw new Error("Não foi possível baixar a faixa.");
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
    <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="brs-eq-bar w-[2px] rounded-full bg-[#1ed760]"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

function TrackDownloaderButton({
  fileId,
  title,
  sending,
  onSend,
  compact = false,
}: {
  fileId: string;
  title: string;
  sending: boolean;
  onSend: () => void;
  compact?: boolean;
}) {
  const sync = useDownloaderSync();
  const job = sync?.getJobForTrack(fileId);
  const label = getTrackDownloadLabel(job);

  const isDone = job?.status === "COMPLETED";
  const isError = job?.status === "FAILED";
  const isQueued = job?.status === "PENDING" || job?.status === "RECEIVED";
  const isSending = sending || job?.status === "DOWNLOADING";
  const isBusyState = isSending || isQueued;

  let shortLabel = "Downloader";
  let icon: ReactNode = <MonitorDown className="h-3.5 w-3.5" />;

  if (isSending) {
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    shortLabel = "Enviando";
  } else if (isDone) {
    icon = <Check className="h-3.5 w-3.5" strokeWidth={3} />;
    shortLabel = "Enviado";
  } else if (isError) {
    shortLabel = "Erro";
  } else if (isQueued) {
    shortLabel = "Na fila";
  }

  const toneClass = isDone
    ? "border-[#1ed760]/50 bg-[#1ed760]/20 text-[#1ed760]"
    : isError
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : isBusyState
        ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
        : "border-[#1ed760]/40 bg-[#1ed760]/10 text-[#1ed760] hover:bg-[#1ed760]/20";

  const tooltip = label ?? `Enviar ${title} ao Downloader`;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (!isDone) onSend();
      }}
      disabled={isSending || (isQueued && !isError)}
      title={tooltip}
      aria-label={`Enviar ${title} ao Downloader`}
      className={`inline-flex flex-shrink-0 items-center justify-center gap-1 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70 ${toneClass} ${
        compact ? "h-10 w-10 px-0 md:h-8 md:w-8" : "h-8 gap-1 px-2"
      }`}
    >
      {icon}
      {!compact ? (
        <>
          <span className="hidden sm:inline">{shortLabel}</span>
          <span className="sm:hidden">{isDone || isSending || isQueued || isError ? shortLabel : "⬇"}</span>
        </>
      ) : null}
    </button>
  );
}

type StreamingRowProps = {
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
  setDomAnchor?: boolean;
  progress: number;
  currentTime: number;
  /** Duração do player (só ativa) ou cache. */
  displayDuration: number;
  onToggle: () => void;
  onSeek: (ratio: number) => void;
  onDownload: () => void;
  isDownloading: boolean;
  onSendToDownloader: () => void;
  isSendingToDownloader: boolean;
  onToggleSelected: () => void;
  onQueueNext: () => void;
  onShare: () => void;
  onCopyLink: () => void;
};

function streamingRowEqual(prev: StreamingRowProps, next: StreamingRowProps) {
  const activeChanged = prev.isActive !== next.isActive || prev.isPlaying !== next.isPlaying;
  if (prev.isActive || next.isActive || activeChanged) {
    return (
      prev.track.id === next.track.id &&
      prev.index === next.index &&
      prev.canPlay === next.canPlay &&
      prev.canDownload === next.canDownload &&
      prev.selectionMode === next.selectionMode &&
      prev.isSelected === next.isSelected &&
      prev.isActive === next.isActive &&
      prev.isPlaying === next.isPlaying &&
      prev.isLoading === next.isLoading &&
      prev.isBusy === next.isBusy &&
      prev.isHighlighted === next.isHighlighted &&
      prev.progress === next.progress &&
      prev.currentTime === next.currentTime &&
      prev.displayDuration === next.displayDuration &&
      prev.isDownloading === next.isDownloading &&
      prev.isSendingToDownloader === next.isSendingToDownloader &&
      prev.onToggle === next.onToggle &&
      prev.onSeek === next.onSeek
    );
  }
  return (
    prev.track.id === next.track.id &&
    prev.index === next.index &&
    prev.canPlay === next.canPlay &&
    prev.canDownload === next.canDownload &&
    prev.selectionMode === next.selectionMode &&
    prev.isSelected === next.isSelected &&
    prev.isPlaying === next.isPlaying &&
    prev.isLoading === next.isLoading &&
    prev.isBusy === next.isBusy &&
    prev.isHighlighted === next.isHighlighted &&
    prev.displayDuration === next.displayDuration &&
    prev.isDownloading === next.isDownloading &&
    prev.isSendingToDownloader === next.isSendingToDownloader
  );
}

const StreamingTrackRow = memo(function StreamingTrackRow({
  track,
  index: _index,
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
  displayDuration,
  onToggle,
  onSeek,
  onDownload,
  isDownloading,
  onSendToDownloader,
  isSendingToDownloader,
  onToggleSelected,
  onQueueNext,
  onShare,
  onCopyLink,
}: StreamingRowProps) {
  const display = getTrackDisplayMetadata(track);
  const a11yName = `${display.title} — ${display.artist}`;
  const showDuration = displayDuration > 0;

  const menuActions = useMemo(() => {
    const actions: CollectionMenuAction[] = [
      {
        id: "play",
        label: "Reproduzir agora",
        icon: Play,
        disabled: !canPlay || selectionMode,
        onClick: onToggle,
      },
      {
        id: "queue",
        label: "Adicionar à fila",
        icon: ListPlus,
        disabled: !canPlay || selectionMode,
        onClick: onQueueNext,
      },
    ];
    if (canDownload) {
      actions.push(
        {
          id: "downloader",
          label: "Enviar ao Downloader",
          icon: MonitorDown,
          disabled: isSendingToDownloader,
          onClick: onSendToDownloader,
        },
        {
          id: "download",
          label: "Baixar arquivo",
          icon: Download,
          disabled: isDownloading,
          onClick: onDownload,
        },
      );
    }
    actions.push(
      { id: "copy", label: "Copiar link", icon: Copy, onClick: onCopyLink },
      { id: "share", label: "Compartilhar", icon: Share2, onClick: onShare },
    );
    return actions;
  }, [
    canDownload,
    canPlay,
    isDownloading,
    isSendingToDownloader,
    onCopyLink,
    onDownload,
    onQueueNext,
    onSendToDownloader,
    onShare,
    onToggle,
    selectionMode,
  ]);

  const rowBg = isHighlighted || isSelected || isActive
    ? "bg-[rgba(0,255,110,0.05)]"
    : "bg-transparent hover:bg-[rgba(249,168,212,0.06)]";

  function handleSeekClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)));
  }

  const playButton = canPlay ? (
    <button
      type="button"
      onClick={onToggle}
      disabled={isBusy || selectionMode}
      aria-label={isPlaying ? `Pausar ${display.title}` : `Reproduzir ${display.title}`}
      className="group/play flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 ease-out hover:bg-white/10 group-hover/row:scale-105 disabled:opacity-40 md:h-9 md:w-9"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#1ed760]" />
      ) : isPlaying ? (
        <>
          {/* EQ no lugar do play; pause/play reaparecem no hover (desktop). */}
          <span className="flex items-center justify-center [@media(hover:hover)]:group-hover/row:hidden [@media(hover:hover)]:group-focus-visible/play:hidden">
            <PlayingBars />
          </span>
          <Pause className="hidden h-4 w-4 [@media(hover:hover)]:group-hover/row:block [@media(hover:hover)]:group-focus-visible/play:block" fill="currentColor" />
        </>
      ) : (
        <Play className="ml-0.5 h-4 w-4 transition-colors duration-200 group-hover/row:text-[#f9a8d4]" fill="currentColor" />
      )}
    </button>
  ) : (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-zinc-600 md:h-9 md:w-9" aria-hidden>
      <Lock className="h-3.5 w-3.5" />
    </div>
  );

  const titleBlock = (
    <div className="min-w-0 flex-1 overflow-hidden transition-transform duration-200 ease-out group-hover/row:translate-x-0.5">
      <button
        type="button"
        onClick={selectionMode && canDownload ? onToggleSelected : canPlay ? onToggle : undefined}
        disabled={!canPlay && !selectionMode}
        className="min-w-0 w-full overflow-hidden text-left"
        aria-label={a11yName}
        title={a11yName}
      >
        <p
          className={`truncate text-[14px] font-medium leading-snug transition-colors duration-200 ${
            isActive || isPlaying
              ? "text-[#1ed760]"
              : "text-white group-hover/row:text-[#f9a8d4]"
          }`}
        >
          {display.title}
        </p>
        <p className="mt-0.5 truncate text-[12px] leading-snug text-white/45 transition-colors duration-200 group-hover/row:text-[#f9a8d4]/70">
          {display.artist}
        </p>
      </button>
    </div>
  );

  const progressBlock =
    isActive && canPlay && !selectionMode && showDuration ? (
      <div className="mt-2 flex items-center gap-2">
        <span className="w-8 flex-shrink-0 font-mono text-[10px] tabular-nums text-white/40">
          {formatTime(currentTime)}
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Progresso"
          aria-valuemin={0}
          aria-valuemax={Math.round(displayDuration)}
          aria-valuenow={Math.round(currentTime)}
          className="h-3 min-w-0 flex-1 cursor-pointer py-1"
          onClick={handleSeekClick}
        >
          <div className="h-[3px] rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-[#1ed760]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
        <span className="w-8 flex-shrink-0 text-right font-mono text-[10px] tabular-nums text-white/40">
          {formatTime(displayDuration)}
        </span>
      </div>
    ) : null;

  const showSideDuration = showDuration && !(isActive && canPlay && !selectionMode);

  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`group/row relative border-b border-[#1ed760]/15 transition-[background-color,box-shadow] duration-200 ease-out last:border-b-0 ${rowBg} ${
        isActive || isPlaying || isSelected || isHighlighted
          ? ""
          : "hover:shadow-[inset_3px_0_0_0_#f9a8d4]"
      }`}
    >
      {/* Mobile — play | título/progresso | download/menu */}
      <div className="flex items-center gap-2.5 px-3 py-3 md:hidden">
        {selectionMode && canDownload ? (
          <button
            type="button"
            onClick={onToggleSelected}
            aria-label={isSelected ? `Remover ${display.title} da seleção` : `Selecionar ${display.title}`}
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border ${
              isSelected
                ? "border-[#1ed760] bg-[#1ed760] text-black"
                : "border-zinc-600 text-transparent"
            }`}
          >
            {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
          </button>
        ) : null}
        {playButton}
        <div className="min-w-0 flex-1">
          {titleBlock}
          {progressBlock}
          {showSideDuration ? (
            <p className="mt-1 font-mono text-[11px] tabular-nums text-white/40">
              {formatTime(displayDuration)}
            </p>
          ) : null}
        </div>
        {!selectionMode ? (
          <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
            {canDownload ? (
              <TrackDownloaderButton
                fileId={track.id}
                title={display.title}
                sending={isSendingToDownloader}
                onSend={onSendToDownloader}
                compact
              />
            ) : null}
            <CollectionContextMenu
              label={`Opções · ${display.title}`}
              buttonClassName="!h-10 !w-10 text-white/60 hover:text-white"
              actions={menuActions}
            />
          </div>
        ) : null}
      </div>

      {/* Desktop */}
      <div className={`${STREAM_DESKTOP_GRID} px-3 py-2`}>
        <div className="flex items-center justify-center">
          {selectionMode && canDownload ? (
            <button
              type="button"
              onClick={onToggleSelected}
              aria-label={isSelected ? `Remover ${display.title} da seleção` : `Selecionar ${display.title}`}
              className={`flex h-5 w-5 items-center justify-center rounded border ${
                isSelected
                  ? "border-[#1ed760] bg-[#1ed760] text-black"
                  : "border-zinc-600 text-transparent hover:border-zinc-400"
              }`}
            >
              {isSelected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </button>
          ) : (
            playButton
          )}
        </div>

        <div className="min-w-0 py-0.5">
          {titleBlock}
          {progressBlock}
        </div>

        <div className="text-right font-mono text-[12px] tabular-nums text-white/40">
          {showSideDuration ? formatTime(displayDuration) : null}
        </div>

        <div className="flex items-center justify-center opacity-80 transition-opacity group-hover/row:opacity-100">
          {canDownload && !selectionMode ? (
            <TrackDownloaderButton
              fileId={track.id}
              title={display.title}
              sending={isSendingToDownloader}
              onSend={onSendToDownloader}
              compact
            />
          ) : null}
        </div>

        <div className="flex items-center justify-end opacity-50 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
          {!selectionMode ? (
            <CollectionContextMenu
              label={`Opções · ${display.title}`}
              buttonClassName="!h-8 !w-8 text-white/50 hover:text-white"
              actions={menuActions}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}, streamingRowEqual);

/** Discografia (coleções) — layout compacto preservado. */
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
  displayDuration,
  onToggle,
  menuActions,
}: {
  track: PreviewTrack;
  index: number;
  canPlay: boolean;
  isActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isBusy: boolean;
  isHighlighted: boolean;
  setDomAnchor?: boolean;
  displayDuration: number;
  onToggle: () => void;
  menuActions: CollectionMenuAction[];
}) {
  const display = getTrackDisplayMetadata(track);
  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`group/row flex items-center gap-1 rounded-md transition-colors hover:bg-white/[0.06] ${
        isActive || isPlaying ? "bg-white/[0.04]" : ""
      }`}
    >
      <button
        type="button"
        onClick={canPlay ? onToggle : undefined}
        disabled={!canPlay || isBusy}
        className={`${DISCOGRAPHY_GRID} min-w-0 flex-1 px-2 py-2.5 text-left sm:px-3`}
        aria-label={`${display.title} — ${display.artist}`}
      >
        <div className="flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
          ) : isPlaying ? (
            <>
              <span className="flex items-center justify-center [@media(hover:hover)]:group-hover/row:hidden">
                <PlayingBars />
              </span>
              <Pause className="hidden h-3.5 w-3.5 text-[#1ed760] [@media(hover:hover)]:group-hover/row:block" fill="currentColor" />
            </>
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
        <div className="min-w-0 overflow-hidden">
          <p className={`truncate text-[14px] font-medium ${isPlaying || isActive ? "text-[#1ed760]" : "text-white"}`}>
            {display.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-white/45">{display.artist}</p>
        </div>
        <div className="text-right font-mono text-xs tabular-nums text-zinc-500">
          {displayDuration > 0 ? formatTime(displayDuration) : null}
        </div>
      </button>
      <div className="flex-shrink-0 pr-1 sm:pr-2">
        <CollectionContextMenu
          label={`Opções · ${display.title}`}
          buttonClassName="!h-8 !w-8 text-zinc-500 hover:text-white"
          actions={menuActions}
        />
      </div>
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
  embedded = false,
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
    queueTrackNext,
    seek,
    setFolderPlayback,
  } = useVipMusicPlayer();

  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(highlightTrackId ?? null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [durationById, setDurationById] = useState<Record<string, number>>({});
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
    if (!isThisFolder || !playingId || !(duration > 0)) return;
    setDurationById((prev) =>
      prev[playingId] === duration ? prev : { ...prev, [playingId]: duration },
    );
  }, [duration, isThisFolder, playingId]);

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
      if (playingId !== activeId) await handleToggle(activeId);
      await seek(ratio);
    },
    [activeId, canPlay, handleToggle, isThisFolder, playingId, seek, selectionMode],
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
    [batchSending, ensureDownloaderAccess, relativePath, sendingId, showToast, sync],
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
      showToast(
        result.count === 1
          ? "Adicionado ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader`,
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

  const handleDownloadSelected = useCallback(async () => {
    const selectedTracks = tracks.filter((track) => selectedIds.has(track.id));
    for (const track of selectedTracks) {
      try {
        await triggerDownload(track);
      } catch {
        showToast(`Falha ao baixar ${getTrackDisplayMetadata(track).title}`, "error");
      }
    }
  }, [selectedIds, showToast, tracks]);

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

  const copyTrackLink = useCallback(
    (track: PreviewTrack) => {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?faixa=${encodeURIComponent(track.id)}`
          : "";
      void navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link copiado"))
        .catch(() => showToast("Não foi possível copiar o link.", "error"));
    },
    [showToast],
  );

  const shareTrack = useCallback(
    async (track: PreviewTrack) => {
      const display = getTrackDisplayMetadata(track);
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}?faixa=${encodeURIComponent(track.id)}`
          : "";
      try {
        if (navigator.share) {
          await navigator.share({ title: display.title, text: `${display.title} — ${display.artist}`, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        showToast("Link copiado para compartilhar");
      } catch {
        /* user cancelled share */
      }
    },
    [showToast],
  );

  if (tracks.length === 0) return null;

  const useStreaming = layout === "table" || layout === "default";
  const useDiscography = layout === "discography";

  return (
    <div className={embedded ? "" : "overflow-hidden rounded-xl border border-white/[0.06] bg-[#0f1012]"}>
      {error && isThisFolder && (
        <p className="border-b border-white/[0.06] px-3 py-2 text-center text-[11px] text-red-400">{error}</p>
      )}

      {canDownload && tracks.length > 1 && !useDiscography && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={selectAllTracks}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedCount === 0}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={exitSelectionMode}
                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSelectionMode(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-[#1ed760]"
            >
              <Check className="h-3 w-3" />
              Selecionar faixas
            </button>
          )}
        </div>
      )}

      {useDiscography ? (
        <div className="px-1 py-1">
          {tracks.map((track, index) => {
            const isActive = activeId === track.id;
            const isPlaying = isThisFolder && playingId === track.id;
            const displayDuration =
              isActive && isThisFolder && duration > 0 ? duration : durationById[track.id] ?? 0;
            const menuActions: CollectionMenuAction[] = [
              { id: "play", label: "Reproduzir agora", icon: Play, onClick: () => void handleToggle(track.id) },
              {
                id: "copy",
                label: "Copiar link",
                icon: Copy,
                onClick: () => copyTrackLink(track),
              },
            ];
            if (canDownload) {
              menuActions.splice(1, 0, {
                id: "downloader",
                label: "Enviar ao Downloader",
                icon: MonitorDown,
                onClick: () => void handleSendToDownloader(track),
              });
            }
            return (
              <DiscographyTrackRow
                key={track.id}
                track={track}
                index={index}
                canPlay={canPlay}
                isActive={isActive}
                isPlaying={isPlaying}
                isLoading={isThisFolder && loadingId === track.id}
                isBusy={isGlobalBusy && loadingId !== track.id}
                isHighlighted={highlightTrackId === track.id}
                displayDuration={displayDuration}
                onToggle={() => void handleToggle(track.id)}
                menuActions={menuActions}
              />
            );
          })}
        </div>
      ) : null}

      {useStreaming ? (
        <div>
          {tracks.map((track, index) => {
            const isActive = activeId === track.id;
            const isPlaying = isThisFolder && playingId === track.id;
            const displayDuration =
              isActive && isThisFolder && duration > 0 ? duration : durationById[track.id] ?? 0;
            return (
              <StreamingTrackRow
                key={track.id}
                track={track}
                index={index}
                canPlay={canPlay}
                canDownload={canDownload}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(track.id)}
                isActive={isActive}
                isPlaying={isPlaying}
                isLoading={isThisFolder && loadingId === track.id}
                isBusy={isGlobalBusy && loadingId !== track.id}
                isHighlighted={highlightTrackId === track.id}
                progress={isActive && isThisFolder ? progress : 0}
                currentTime={isActive && isThisFolder ? currentTime : 0}
                displayDuration={displayDuration}
                onToggle={() => void handleToggle(track.id)}
                onSeek={(ratio) => void handleSeek(ratio)}
                onDownload={() => void handleDownload(track)}
                isDownloading={downloadingId === track.id}
                onSendToDownloader={() => void handleSendToDownloader(track)}
                isSendingToDownloader={sendingId === track.id}
                onToggleSelected={() => toggleTrackSelected(track.id)}
                onQueueNext={() => {
                  queueTrackNext(folderId, track.id);
                  showToast("Adicionada à fila");
                }}
                onShare={() => void shareTrack(track)}
                onCopyLink={() => copyTrackLink(track)}
              />
            );
          })}
        </div>
      ) : null}

      {selectionMode && selectedCount > 0 ? (
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0f1012]/95 px-3 py-3 backdrop-blur-md">
          <p className="text-xs font-semibold text-white">
            {selectedCount} selecionada{selectedCount === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => void handleSendSelectedToDownloader()}
            disabled={batchSending}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1ed760] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            {batchSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
            Enviar ao Downloader
          </button>
          <button
            type="button"
            onClick={() => void handleDownloadSelected()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar
          </button>
          <button
            type="button"
            onClick={exitSelectionMode}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
          >
            <Square className="h-3 w-3" />
            Cancelar
          </button>
        </div>
      ) : null}
    </div>
  );
}
