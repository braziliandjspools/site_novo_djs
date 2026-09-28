"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Download,
  HardDrive,
  HelpCircle,
  ListPlus,
  Loader2,
  Lock,
  MonitorDown,
  Pause,
  Play,
  Share2,
  Square,
} from "lucide-react";
import { type PreviewTrack } from "../../lib/google-drive";
import { getTrackDisplayMetadata } from "../../lib/track-display-metadata";
import { PLACEHOLDER } from "../../lib/theme";
import { startBrowserTrackDownload } from "../lib/browser-download-file";
import { sendTrackToDownloader, sendTracksToDownloaderBatch } from "../lib/send-to-downloader";
import { getTrackDownloadLabel } from "../lib/downloader-sync";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { VipLockedPlayHint } from "../VipUpgradeGate";
import { recordContinueFromTrack } from "../lib/music-library-storage";
import { folderHref, slugifyStyleName } from "../../lib/vip-music-slugs";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";
import {
  BROWSER_BULK_CONFIRM_THRESHOLD,
  isDownloaderSendCancelled,
} from "./DownloaderBulkConfirm";
import { BrowserPackDownloadConfirm } from "./BrowserPackDownloadConfirm";
import { ArtistNameLink } from "./ArtistNameLink";
import { DriveAccessHelpDialog } from "./DriveAccessHelpDialog";
import {
  flattenTrackSections,
  groupTracksByUploadDate,
} from "../lib/track-date-groups";

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
  /** Agrupa por data de upload (Drive). Padrão: ligado em `table`. */
  groupByDate?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => Promise<{ tracks: PreviewTrack[]; hasMore: boolean } | null | undefined | void>;
  /** Mostra acesso ao Drive somente nas pastas finais/estilos. */
  showDriveButton?: boolean;
};

const STREAM_DESKTOP_GRID =
  "hidden md:grid md:grid-cols-[52px_minmax(0,1fr)_56px_36px_36px_36px_36px] xl:grid-cols-[52px_minmax(0,1fr)_52px_52px_56px_36px_36px_36px_36px] md:items-center md:gap-x-3";
const STREAM_DESKTOP_GRID_SELECT =
  "hidden md:grid md:grid-cols-[28px_52px_minmax(0,1fr)_56px_36px_36px_36px_36px] xl:grid-cols-[28px_52px_minmax(0,1fr)_52px_52px_56px_36px_36px_36px_36px] md:items-center md:gap-x-3";

const DISCOGRAPHY_GRID = "grid grid-cols-[2.75rem_minmax(0,1fr)_3.5rem] items-center gap-x-3 sm:gap-x-4";

/** Capa da pasta (folder.png) → padrão BRS. */
function resolveTrackCoverSrc(track: PreviewTrack, albumCoverUrl?: string | null) {
  return albumCoverUrl?.trim() || PLACEHOLDER.trackCover;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function triggerDownload(track: PreviewTrack) {
  // Auth + 302 para o Drive (sem carregar o MP3 na RAM nem proxyar pela VPS).
  startBrowserTrackDownload(track);
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    // Fallback para navegadores que bloqueiam a Clipboard API após a validação assíncrona.
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  try {
    if (!document.execCommand("copy")) throw new Error("Permissão para copiar negada pelo navegador.");
  } finally {
    input.remove();
  }
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
        ? "border-[#1ed760]/40 bg-[#1ed760]/10 text-[#1ed760]"
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
      className={`inline-flex flex-shrink-0 items-center justify-center gap-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-70 ${toneClass} ${
        compact ? "h-10 w-10 px-0 md:h-9 md:w-9" : "h-8 gap-1 px-2"
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

function MobilePlayingTitle({ title, active }: { title: string; active: boolean }) {
  const viewportRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [motion, setMotion] = useState({ overflowing: false, distance: 0, duration: 8 });

  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const text = textRef.current;
      const width = text?.scrollWidth ?? 0;
      const overflowing = Boolean(viewport && width > viewport.clientWidth + 2);
      setMotion({ overflowing, distance: width + 24, duration: Math.max(8, (width + 24) / 36) });
    };
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (viewportRef.current) observer?.observe(viewportRef.current);
    if (textRef.current) observer?.observe(textRef.current);
    return () => observer?.disconnect();
  }, [title]);

  return (
    <span ref={viewportRef} className="block min-w-0 w-full overflow-hidden md:hidden">
      <span
        style={{ "--brs-marquee-distance": `${motion.distance}px`, "--brs-marquee-duration": `${motion.duration}s` } as CSSProperties}
        className={`flex w-max max-w-none items-center whitespace-nowrap text-[12px] font-semibold leading-snug tracking-[-0.02em] transition-colors duration-200 sm:text-[13px] ${
          active ? "text-[#1ed760]" : "text-white"
        } ${active && motion.overflowing ? "brs-mobile-track-marquee" : ""}`}
      >
        <span ref={textRef}>{title}</span>
        {active && motion.overflowing ? <span className="pl-6" aria-hidden="true">{title}</span> : null}
      </span>
    </span>
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
  /** Capa da pasta/álbum (folder.png), fallback visual. */
  albumCoverUrl?: string | null;
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
  showDriveButton: boolean;
};

function streamingRowEqual(prev: StreamingRowProps, next: StreamingRowProps) {
  const coverSame =
    prev.albumCoverUrl === next.albumCoverUrl &&
    (prev.track.coverUrl ?? null) === (next.track.coverUrl ?? null);
  const activeChanged = prev.isActive !== next.isActive || prev.isPlaying !== next.isPlaying;
  if (prev.isActive || next.isActive || activeChanged) {
    return (
      prev.track.id === next.track.id &&
      coverSame &&
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
    coverSame &&
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
  albumCoverUrl,
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
  showDriveButton,
}: StreamingRowProps) {
  const display = getTrackDisplayMetadata(track);
  const a11yName = `${display.title} — ${display.artist}`;
  const showDuration = displayDuration > 0;
  const coverSrc = resolveTrackCoverSrc(track, albumCoverUrl);
  const coverUnoptimized = coverSrc.startsWith("/api/");
  const { authenticated, hasVip, userEmail } = useMusicasSession();
  const { showToast } = useMusicasToast();
  const [driveHelpOpen, setDriveHelpOpen] = useState(false);
  const [copyingDrive, setCopyingDrive] = useState(false);
  const gmailDriveAllowed =
    authenticated && hasVip && /@gmail\.com$/i.test(userEmail.trim());

  const copyDriveLink = useCallback(async (format: "drive" | "direct" = "drive") => {
    if (!gmailDriveAllowed || copyingDrive) return;
    setCopyingDrive(true);
    try {
      const suffix = format === "direct" ? "?format=direct" : "";
      const response = await fetch(`/api/musicas/drive/${encodeURIComponent(track.id)}/link${suffix}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Link de download indisponível.");
      await copyToClipboard(result.url);
      showToast(format === "direct" ? "Link direto copiado. Válido por 2 horas." : "Link do Google Drive copiado");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível copiar o link do Drive.", "error");
    } finally {
      setCopyingDrive(false);
    }
  }, [copyingDrive, gmailDriveAllowed, showToast, track.id]);

  const explainDriveBlock = useCallback(() => {
    setDriveHelpOpen(true);
  }, []);

  const menuActions = useMemo(() => {
    const actions: CollectionMenuAction[] = [
      {
        id: "play",
        label: "Reproduzir agora",
        icon: Play,
        disabled: !canPlay,
        onClick: onToggle,
      },
      {
        id: "queue",
        label: "Adicionar à fila",
        icon: ListPlus,
        disabled: !canPlay,
        onClick: onQueueNext,
      },
    ];
    if (canDownload) {
      actions.push({
        id: "downloader",
        label: "Enviar ao Downloader",
        icon: MonitorDown,
        disabled: isSendingToDownloader,
        onClick: onSendToDownloader,
      });
    }
    if (showDriveButton && gmailDriveAllowed) {
      actions.push({
        id: "external-download",
        label: "Copiar link direto · Allavsoft/JDownloader",
        icon: Download,
        disabled: copyingDrive,
        onClick: () => void copyDriveLink("direct"),
      });
    }
    actions.push(
      { id: "copy", label: "Copiar link", icon: Copy, onClick: onCopyLink },
      { id: "share", label: "Compartilhar", icon: Share2, onClick: onShare },
    );
    return actions;
  }, [
    canDownload,
    canPlay,
    showDriveButton,
    gmailDriveAllowed,
    copyingDrive,
    copyDriveLink,
    isSendingToDownloader,
    onCopyLink,
    onQueueNext,
    onSendToDownloader,
    onShare,
    onToggle,
  ]);

  const mobileMenuActions = useMemo(() => {
    const actions = [...menuActions];
    const extras: CollectionMenuAction[] = [];
    if (canDownload) {
      extras.push({
        id: "download-browser",
        label: "Baixar no navegador",
        icon: Download,
        disabled: isDownloading,
        onClick: onDownload,
      });
    }
    if (showDriveButton && authenticated && hasVip) {
      extras.push(gmailDriveAllowed
        ? { id: "drive", label: "Copiar link do Google Drive", icon: HardDrive, disabled: copyingDrive, onClick: () => void copyDriveLink("drive") }
        : { id: "drive-help", label: "Drive indisponível — por quê?", icon: HelpCircle, onClick: explainDriveBlock });
    }
    const beforeCopy = actions.findIndex((action) => action.id === "copy");
    actions.splice(beforeCopy, 0, ...extras);
    return actions;
  }, [menuActions, canDownload, isDownloading, onDownload, showDriveButton, authenticated, hasVip, gmailDriveAllowed, copyingDrive, copyDriveLink, explainDriveBlock]);

  const rowBg =
    isHighlighted || isSelected || isActive
      ? "bg-[#102018]"
      : "bg-[#0b0e0c] hover:bg-[#141c16]";

  function handleSeekClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)));
  }

  function handleSeekKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      onSeek(Math.max(0, Math.min(1, currentTime / displayDuration + (event.key === "ArrowRight" ? 5 : -5) / displayDuration)));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      onSeek(event.key === "Home" ? 0 : 1);
    }
  }

  const coverButtonClass =
    "group/play relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-white/[0.08] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.7)] transition-[transform,box-shadow] duration-200 ease-out group-hover/row:scale-[1.03] group-hover/row:ring-white/[0.14] disabled:opacity-40 md:h-11 md:w-11";

  const playButton = canPlay ? (
    <button
      type="button"
      onClick={onToggle}
      disabled={isBusy}
      aria-label={isPlaying ? `Pausar ${display.title}` : `Reproduzir ${display.title}`}
      className={coverButtonClass}
    >
      <Image
        src={coverSrc}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
        unoptimized={coverUnoptimized}
      />
      <span
        className={`absolute inset-0 transition-colors duration-200 ${
          isPlaying || isLoading
            ? "bg-black/50"
            : "bg-black/20 [@media(hover:hover)]:group-hover/row:bg-black/55"
        }`}
        aria-hidden
      />
      <span className="relative z-10 flex h-full w-full items-center justify-center text-white">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#1ed760]" />
        ) : isPlaying ? (
          <>
            <span className="flex items-center justify-center [@media(hover:hover)]:group-hover/row:hidden [@media(hover:hover)]:group-focus-visible/play:hidden">
              <PlayingBars />
            </span>
            <Pause className="hidden h-4 w-4 [@media(hover:hover)]:group-hover/row:block [@media(hover:hover)]:group-focus-visible/play:block" fill="currentColor" />
          </>
        ) : (
          <Play className="ml-0.5 h-4 w-4 opacity-90 drop-shadow" fill="currentColor" />
        )}
      </span>
    </button>
  ) : (
    <VipLockedPlayHint>
      <button
        type="button"
        aria-label={`Play bloqueado — ${display.title}. Assine o VIP para ouvir.`}
        className={coverButtonClass}
      >
        <Image
          src={coverSrc}
          alt=""
          fill
          sizes="48px"
          className="object-cover opacity-75"
          unoptimized={coverUnoptimized}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[#1ed760] transition-colors group-hover/locked:bg-black/70">
          <Lock className="h-3.5 w-3.5" />
        </span>
      </button>
    </VipLockedPlayHint>
  );

  const uploadedAt = track.modifiedAt ? Date.parse(track.modifiedAt) : NaN;
  const isRecentlyAdded = Number.isFinite(uploadedAt) && uploadedAt <= Date.now() && Date.now() - uploadedAt < 7 * 86_400_000;

  const titleBlock = (
    <div className="min-w-0 flex-1 overflow-hidden font-[family-name:var(--font-player)] transition-transform duration-200 ease-out group-hover/row:translate-x-0.5">
      <p className="min-w-0 w-full overflow-hidden text-left" title={a11yName}>
        <MobilePlayingTitle title={display.title} active={isPlaying} />
        <span
          className={`hidden truncate text-[12px] font-semibold leading-snug tracking-[-0.02em] transition-colors duration-200 sm:text-[13px] md:block ${
            isActive || isPlaying ? "text-[#1ed760]" : "text-white"
          }`}
        >
          {display.title}
        </span>
      </p>
      {isRecentlyAdded ? <span className="mt-1 inline-flex rounded border border-green-400/40 bg-green-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-200">Nova</span> : null}
      <ArtistNameLink
        artist={display.artist}
        className="mt-0.5 block truncate text-[12px] leading-snug text-white/50"
      />
      {track.bpm || track.musicalKey ? (
        <div className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] font-semibold text-white/50 xl:hidden">
          {track.bpm ? <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5">{track.bpm} BPM</span> : null}
          {track.musicalKey ? <span className="rounded border border-[#1ed760]/20 bg-[#1ed760]/[0.07] px-1.5 py-0.5 text-[#86e7a7]">{track.musicalKey}</span> : null}
        </div>
      ) : null}
    </div>
  );

  const progressBlock =
    isActive && canPlay && showDuration ? (
      <div className="mt-2 flex items-center gap-2">
        <span className="w-9 flex-shrink-0 font-mono text-[10px] tabular-nums text-white/40 sm:w-8">
          {formatTime(currentTime)}
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Posição de reprodução de ${display.title}`}
          aria-valuemin={0}
          aria-valuemax={Math.round(displayDuration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} de ${formatTime(displayDuration)}`}
          className="flex h-8 min-w-0 flex-1 cursor-pointer items-center py-2 touch-manipulation sm:h-5 sm:py-1"
          onClick={handleSeekClick}
          onKeyDown={handleSeekKeyDown}
        >
          <div className="relative h-1.5 w-full rounded-sm bg-[#344038] sm:h-1">
            <div
              className="relative h-full rounded-sm bg-[#1ed760]"
              style={{ width: `${Math.min(100, progress)}%` }}
            >
              <span className="absolute -right-1 top-1/2 h-3 w-2 -translate-y-1/2 rounded-sm bg-[#a7ffc6] shadow-[0_0_8px_rgba(30,215,96,0.6)] sm:h-2.5" />
            </div>
            <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_calc(10%_-_1px),rgba(8,14,9,0.5)_calc(10%_-_1px),rgba(8,14,9,0.5)_10%)]" aria-hidden />
          </div>
        </div>
        <span className="w-9 flex-shrink-0 text-right font-mono text-[10px] tabular-nums text-white/40 sm:w-8">
          {formatTime(displayDuration)}
        </span>
      </div>
    ) : null;

  const showSideDuration = showDuration && !(isActive && canPlay);

  const selectCheckbox =
    selectionMode && canDownload ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleSelected();
        }}
        aria-label={isSelected ? `Remover ${display.title} da seleção` : `Selecionar ${display.title}`}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border transition-colors md:h-5 md:w-5 ${
          isSelected
            ? "border-[#1ed760] bg-[#1ed760] text-black"
            : "border-white/25 bg-black/20 text-transparent hover:border-white/45"
        }`}
      >
        {isSelected ? <Check className="h-3.5 w-3.5 md:h-3 md:w-3" strokeWidth={3} /> : null}
      </button>
    ) : null;

  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`group/row relative hover:z-10 focus-within:z-10 border-b border-white/[0.06] transition-[background-color,box-shadow] duration-200 ease-out last:border-b-0 ${rowBg} ${
        isActive || isPlaying || isSelected || isHighlighted
          ? "shadow-[inset_3px_0_0_0_#1ed760]"
          : "hover:shadow-[inset_3px_0_0_0_rgba(30,215,96,0.55)]"
      }`}
    >
      {/* Mobile */}
      <div className="flex items-center gap-2.5 px-3 py-3 md:hidden">
        {selectCheckbox}
        {playButton}
        <div className="min-w-0 flex-1">
          {titleBlock}
          {progressBlock}
          {showSideDuration ? (
            <p className="mt-1.5 font-mono text-[11px] tabular-nums text-white/40">
              {formatTime(displayDuration)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-shrink-0 items-center">
          <CollectionContextMenu
            label={`Opções · ${display.title}`}
            buttonClassName="!h-10 !w-10 rounded-xl text-white/55 hover:bg-white/[0.06] hover:text-white"
            actions={mobileMenuActions}
          />
        </div>
      </div>

      {/* Desktop: capa · faixa · BPM · tom · duração · ações */}
      <div
        className={`${selectionMode && canDownload ? STREAM_DESKTOP_GRID_SELECT : STREAM_DESKTOP_GRID} px-3.5 py-2.5`}
      >
        {selectionMode && canDownload ? (
          <div className="flex items-center justify-center">{selectCheckbox}</div>
        ) : null}
        <div className="flex items-center justify-center">{playButton}</div>

        <div className="min-w-0 py-0.5">
          {titleBlock}
          {progressBlock}
        </div>

        <span className="hidden text-center font-mono text-[11px] tabular-nums text-white/60 xl:block">{track.bpm ?? "—"}</span>
        <span className="hidden text-center font-mono text-[11px] text-[#86e7a7] xl:block">{track.musicalKey ?? "—"}</span>

        <div className="text-center font-mono text-[12px] tabular-nums text-white/40">
          {showSideDuration ? formatTime(displayDuration) : null}
        </div>

        <div className="flex items-center justify-center opacity-70 transition-opacity group-hover/row:opacity-100">
          {canDownload ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDownload();
              }}
              disabled={isDownloading}
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-[#1ed760]/40 hover:text-white disabled:opacity-60"
              title={`Baixar ${display.title}`}
              aria-label={`Baixar ${display.title}`}
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
            </button>
          ) : !canPlay ? (
            <Lock className="h-3.5 w-3.5 text-white/35" aria-hidden />
          ) : null}
        </div>

        <div className="flex items-center justify-center opacity-70 transition-opacity group-hover/row:opacity-100">
          {canDownload ? (
            <TrackDownloaderButton
              fileId={track.id}
              title={display.title}
              sending={isSendingToDownloader}
              onSend={onSendToDownloader}
              compact
            />
          ) : null}
        </div>

        <div className="flex items-center justify-center opacity-70 transition-opacity group-hover/row:opacity-100">
          {showDriveButton && authenticated && hasVip ? (
            gmailDriveAllowed ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void copyDriveLink("drive");
                }}
                disabled={copyingDrive}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#1ed760]/30 bg-[#1ed760]/10 text-[#1ed760] transition hover:bg-[#1ed760]/20 disabled:opacity-50"
                title={`Copiar link do Google Drive de ${display.title}`}
                aria-label={`Copiar link do Google Drive de ${display.title}`}
              >
                {copyingDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  explainDriveBlock();
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45 transition hover:border-white/20 hover:text-white/70"
                title="Drive indisponível para este e-mail — clique para entender"
                aria-label="Drive indisponível — saiba por quê"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            )
          ) : null}
        </div>

        <div className="flex items-center justify-end opacity-45 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
          <CollectionContextMenu
            label={`Opções · ${display.title}`}
            buttonClassName="!h-9 !w-9 rounded-xl text-white/50 hover:bg-white/[0.06] hover:text-white"
            actions={menuActions}
          />
        </div>
      </div>
      {driveHelpOpen ? <DriveAccessHelpDialog onClose={() => setDriveHelpOpen(false)} /> : null}
    </article>
  );
}, streamingRowEqual);

/** Discografia (coleções) — layout compacto preservado. */
function DiscographyTrackRow({
  track,
  index: _index,
  canPlay,
  isActive,
  isPlaying,
  isLoading,
  isBusy,
  isHighlighted,
  setDomAnchor = true,
  albumCoverUrl,
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
  albumCoverUrl?: string | null;
  displayDuration: number;
  onToggle: () => void;
  menuActions: CollectionMenuAction[];
}) {
  const display = getTrackDisplayMetadata(track);
  const coverSrc = resolveTrackCoverSrc(track, albumCoverUrl);
  const coverUnoptimized = coverSrc.startsWith("/api/");
  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`group/row flex items-center gap-1 rounded-md transition-colors hover:bg-white/[0.06] ${
        isActive || isPlaying ? "bg-white/[0.04]" : ""
      }`}
    >
      {canPlay ? (
        <div className={`${DISCOGRAPHY_GRID} min-w-0 flex-1 px-2 py-2.5 sm:px-3`}>
          <button
            type="button"
            onClick={onToggle}
            disabled={isBusy}
            className="relative mx-auto h-10 w-10 overflow-hidden rounded-md shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            aria-label={`Reproduzir ${display.title}`}
          >
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              unoptimized={coverUnoptimized}
            />
            <span
              className={`absolute inset-0 transition-colors ${
                isPlaying || isLoading
                  ? "bg-black/45"
                  : "bg-black/20 [@media(hover:hover)]:group-hover/row:bg-black/50"
              }`}
              aria-hidden
            />
            <span className="relative z-10 flex h-full w-full items-center justify-center text-white">
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1ed760]" />
              ) : isPlaying ? (
                <>
                  <span className="flex items-center justify-center [@media(hover:hover)]:group-hover/row:hidden">
                    <PlayingBars />
                  </span>
                  <Pause className="hidden h-3.5 w-3.5 text-white [@media(hover:hover)]:group-hover/row:block" fill="currentColor" />
                </>
              ) : (
                <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white drop-shadow" />
              )}
            </span>
          </button>
          <div className="min-w-0 overflow-hidden font-[family-name:var(--font-player)]">
            <p
              className="block w-full truncate text-left text-[12px] font-semibold tracking-[-0.02em] text-white sm:text-[13px]"
              title={`${display.title} — ${display.artist}`}
            >
              <span className={isPlaying || isActive ? "text-[#1ed760]" : "text-white"}>
                {display.title}
              </span>
            </p>
            <ArtistNameLink
              artist={display.artist}
              className="mt-0.5 block truncate text-[12px] text-white/45"
            />
          </div>
          <span className="hidden text-center font-mono text-[11px] tabular-nums text-white/35 sm:block">
            {formatTime(displayDuration)}
          </span>
        </div>
      ) : (
        <VipLockedPlayHint className="min-w-0 flex-1" side="top">
          <div className={`${DISCOGRAPHY_GRID} w-full min-w-0 px-2 py-2.5 text-left sm:px-3`}>
            <button
              type="button"
              className="relative mx-auto h-10 w-10 overflow-hidden rounded-md shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              aria-label={`Play bloqueado — ${display.title}. Assine o VIP para ouvir.`}
            >
              <Image
                src={coverSrc}
                alt=""
                fill
                sizes="40px"
                className="object-cover opacity-75"
                unoptimized={coverUnoptimized}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[#1ed760] transition-colors group-hover/locked:bg-black/70">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className="min-w-0 overflow-hidden font-[family-name:var(--font-player)]">
              <p className="truncate text-[12px] font-semibold tracking-[-0.02em] text-white sm:text-[13px]">{display.title}</p>
              <ArtistNameLink
                artist={display.artist}
                className="mt-0.5 block truncate text-[12px] text-white/45"
              />
            </div>
            <span className="hidden text-center font-mono text-[11px] tabular-nums text-white/35 sm:block">
              {formatTime(displayDuration)}
            </span>
          </div>
        </VipLockedPlayHint>
      )}
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
  groupByDate,
  hasMore = false,
  onLoadMore,
  showDriveButton = false,
}: VipMusicTrackListProps) {
  const { authenticated, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const {
    playingFolderId,
    playingId,
    isPlaying: playerIsPlaying,
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
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [browserConfirmOpen, setBrowserConfirmOpen] = useState(false);
  const [durationById, setDurationById] = useState<Record<string, number>>({});
  const autoPlayedRef = useRef<string | null>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;
  const isThisFolder = playingFolderId === folderId;
  const isGlobalBusy = loadingId !== null;
  const shouldGroupByDate = groupByDate ?? true;

  const trackSections = useMemo(
    () => (shouldGroupByDate ? groupTracksByUploadDate(tracks) : null),
    [shouldGroupByDate, tracks],
  );
  const orderedTracks = useMemo(
    () => (trackSections ? flattenTrackSections(trackSections) : tracks),
    [trackSections, tracks],
  );

  useEffect(() => {
    setFolderPlayback(folderId, {
      tracks: orderedTracks,
      hasMore,
      loadMore: async () => loadMoreRef.current?.(),
      coverUrl: coverUrl ?? null,
      albumTitle: albumTitle ?? tracks[0]?.pack ?? null,
    });
  }, [folderId, orderedTracks, hasMore, setFolderPlayback, coverUrl, albumTitle, tracks]);

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
      if (!canPlay) return;
      setFocusedTrackId(id);
      const track = tracks.find((item) => item.id === id);
      if (track && continueContext) {
        const styleSlug = slugifyStyleName(continueContext.styleName);
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
    [canPlay, continueContext, folderId, toggleTrack, tracks],
  );

  const handleSeek = useCallback(
    async (ratio: number) => {
      if (!canPlay || !activeId || !isThisFolder) return;
      if (playingId !== activeId) await handleToggle(activeId);
      await seek(ratio);
    },
    [activeId, canPlay, handleToggle, isThisFolder, playingId, seek],
  );

  const handleDownload = useCallback(
    async (track: PreviewTrack) => {
      if (downloadingId) return;
      setDownloadingId(track.id);
      try {
        await triggerDownload(track);
        showToast("Download iniciado");
      } catch {
        showToast("Não foi possível baixar a faixa. Tente novamente.", "error");
      } finally {
        window.setTimeout(() => setDownloadingId(null), 400);
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
        if (isDownloaderSendCancelled(err)) return;
        showToast(err instanceof Error ? err.message : "Não foi possível enviar para o Downloader.", "error");
      } finally {
        setSendingId(null);
      }
    },
    [batchSending, ensureDownloaderAccess, relativePath, sendingId, showToast, sync],
  );

  const runSendSelectedToDownloader = useCallback(async () => {
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
      if (isDownloaderSendCancelled(err)) return;
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

  const handleSendSelectedToDownloader = useCallback(() => {
    if (batchSending || batchDownloading || sendingId || selectedCount === 0) return;
    if (!ensureDownloaderAccess()) return;
    void runSendSelectedToDownloader();
  }, [
    batchDownloading,
    batchSending,
    ensureDownloaderAccess,
    runSendSelectedToDownloader,
    selectedCount,
    sendingId,
  ]);

  const runDownloadSelected = useCallback(async () => {
    if (batchDownloading || batchSending || selectedCount === 0) return;
    const selectedTracks = tracks.filter((track) => selectedIds.has(track.id));
    if (selectedTracks.length === 0) return;
    setBatchDownloading(true);
    let ok = 0;
    let failed = 0;
    try {
      showToast(
        selectedTracks.length === 1
          ? "Baixando 1 faixa no navegador…"
          : `Baixando ${selectedTracks.length} faixas no navegador…`,
      );
      for (const track of selectedTracks) {
        try {
          await triggerDownload(track);
          ok += 1;
          // Evita disparar dezenas de redirects de uma vez no browser/VPS.
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        } catch {
          failed += 1;
        }
      }
      if (failed === 0) {
        showToast(ok === 1 ? "Download concluído" : `${ok} downloads concluídos`);
      } else {
        showToast(`${ok} ok · ${failed} falharam`, "error");
      }
    } finally {
      setBatchDownloading(false);
    }
  }, [
    batchDownloading,
    batchSending,
    selectedCount,
    selectedIds,
    showToast,
    tracks,
  ]);

  const handleDownloadSelected = useCallback(() => {
    if (batchDownloading || batchSending || selectedCount === 0) return;
    if (selectedCount > BROWSER_BULK_CONFIRM_THRESHOLD) {
      setBrowserConfirmOpen(true);
      return;
    }
    void runDownloadSelected();
  }, [
    batchDownloading,
    batchSending,
    runDownloadSelected,
    selectedCount,
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
    if (!autoPlayTrackId || !canPlay) return;
    if (!tracks.some((track) => track.id === autoPlayTrackId)) return;
    if (autoPlayedRef.current === autoPlayTrackId) return;
    autoPlayedRef.current = autoPlayTrackId;
    void handleToggle(autoPlayTrackId);
  }, [autoPlayTrackId, canPlay, handleToggle, tracks]);

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
  const separateByFolderDate = Boolean(
    trackSections?.some((section) => section.kind === "folder"),
  );
  const panelClass = layout === "table"
    ? "musicas-track-panel overflow-hidden rounded-2xl border border-green-400/15 bg-[#0b0d0b] shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
    : "musicas-track-panel rounded-2xl border border-white/10 bg-[#101210] shadow-[0_18px_40px_rgba(0,0,0,0.35)]";

  function renderStreamingRows(sectionTracks: PreviewTrack[]) {
    return sectionTracks.map((track, index) => {
      const isActive = activeId === track.id;
      const isPlaying = playerIsPlaying && isThisFolder && playingId === track.id;
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
          albumCoverUrl={coverUrl}
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
          showDriveButton={showDriveButton && /^[a-zA-Z0-9_-]+$/.test(track.id)}
        />
      );
    });
  }

  const selectionToolbar =
    canDownload && tracks.length > 1 && !useDiscography ? (
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
        {selectionMode ? (
          <>
            <p className="mr-1 text-xs font-semibold tabular-nums text-white/70">
              {selectedCount} selecionada{selectedCount === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => handleSendSelectedToDownloader()}
              disabled={batchSending || batchDownloading || selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1ed760] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {batchSending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MonitorDown className="h-3 w-3" />
              )}
              Enviar selecionadas ao Downloader
            </button>
            <button
              type="button"
              onClick={() => handleDownloadSelected()}
              disabled={batchSending || batchDownloading || selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
            >
              {batchDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Baixar selecionadas
            </button>
            <span className="mx-0.5 hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
            <button
              type="button"
              onClick={selectAllTracks}
              className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-[#1ed760]/35 hover:bg-[#1ed760]/10 hover:text-[#1ed760]"
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedCount === 0}
              className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={exitSelectionMode}
              className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSelectionMode(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-[#1ed760]/35 hover:bg-[#1ed760]/10 hover:text-[#1ed760]"
          >
            <Check className="h-3 w-3" />
            Selecionar faixas
          </button>
        )}
      </div>
    ) : null;

  const streamingHeader = layout === "table" ? (
    <div className={`${selectionMode && canDownload ? STREAM_DESKTOP_GRID_SELECT : STREAM_DESKTOP_GRID} border-b border-white/10 bg-[#101611] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45`} aria-hidden="true">
      {selectionMode && canDownload ? <span /> : null}
      <span className="text-center">Ouvir</span>
      <span>Faixa</span>
      <span className="hidden text-center xl:block">BPM</span>
      <span className="hidden text-center xl:block">Tom</span>
      <span className="text-center">Tempo</span>
      <span className="col-span-4 text-center">Ações</span>
    </div>
  ) : null;

  return (
    <div className={separateByFolderDate ? "space-y-4" : embedded ? "" : panelClass}>
      {error && isThisFolder && (
        <p className="border-b border-white/[0.06] px-3 py-2 text-center text-[11px] text-red-400">{error}</p>
      )}

      {useDiscography ? (
        <div className="px-1 py-1">
          {tracks.map((track, index) => {
            const isActive = activeId === track.id;
            const isPlaying = playerIsPlaying && isThisFolder && playingId === track.id;
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
                albumCoverUrl={coverUrl}
                displayDuration={displayDuration}
                onToggle={() => void handleToggle(track.id)}
                menuActions={menuActions}
              />
            );
          })}
        </div>
      ) : null}

      {useStreaming && separateByFolderDate && trackSections ? (
        <>
          {selectionToolbar ? (
            <div className={`${panelClass} !shadow-none`}>{selectionToolbar}</div>
          ) : null}
          {trackSections.map((section) => (
            <div key={section.id} className={panelClass}>
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#141414] px-3.5 py-3 sm:px-4">
                <h3 className="text-[13px] font-bold tabular-nums tracking-[0.14em] text-white">
                  {section.title}
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {section.tracks.length} {section.tracks.length === 1 ? "faixa" : "faixas"}
                </p>
              </header>
              {streamingHeader}
              <div>{renderStreamingRows(section.tracks)}</div>
            </div>
          ))}
        </>
      ) : null}

      {useStreaming && !separateByFolderDate ? (
        <div>
          {selectionToolbar}
          {streamingHeader}
          {(trackSections ?? [
            { id: "all", title: "", subtitle: "", isNew: false, kind: "upload" as const, tracks },
          ]).map((section) => (
            <section key={section.id} className="border-b border-white/[0.05] last:border-b-0">
              {trackSections && section.title ? (
                <header
                  className={`flex items-center gap-2.5 border-b px-3.5 py-3 ${
                    section.isNew
                      ? "border-[#1ed760]/20 bg-[rgba(30,215,96,0.07)]"
                      : "border-white/[0.05] bg-white/[0.02]"
                  }`}
                >
                  {section.isNew ? (
                    <span className="rounded-full bg-[#1ed760] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-black">
                      Recente
                    </span>
                  ) : null}
                  <h3
                    className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      section.isNew ? "text-[#1ed760]" : "text-white/60"
                    }`}
                  >
                    {section.title}
                  </h3>
                  {section.subtitle ? (
                    <span className="text-[11px] text-white/35">{section.subtitle}</span>
                  ) : null}
                </header>
              ) : null}
              {renderStreamingRows(section.tracks)}
            </section>
          ))}
        </div>
      ) : null}

      {selectionMode && selectedCount > 0 ? (
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 border-t border-white/[0.08] bg-[#0f1012]/95 px-3.5 py-3 backdrop-blur-md">
          <p className="text-xs font-semibold tabular-nums text-white">
            {selectedCount} selecionada{selectedCount === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => handleSendSelectedToDownloader()}
            disabled={batchSending || batchDownloading}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1ed760] px-3.5 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            {batchSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MonitorDown className="h-3.5 w-3.5" />
            )}
            Enviar selecionadas ao Downloader
          </button>
          <button
            type="button"
            onClick={() => handleDownloadSelected()}
            disabled={batchSending || batchDownloading}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {batchDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Baixar selecionadas
          </button>
          <button
            type="button"
            onClick={exitSelectionMode}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            <Square className="h-3 w-3" />
            Cancelar
          </button>
        </div>
      ) : null}

      <BrowserPackDownloadConfirm
        open={browserConfirmOpen}
        trackCount={selectedCount}
        onConfirm={() => {
          setBrowserConfirmOpen(false);
          void runDownloadSelected();
        }}
        onDismiss={() => setBrowserConfirmOpen(false)}
        onPreferDownloader={() => {
          setBrowserConfirmOpen(false);
          handleSendSelectedToDownloader();
        }}
      />
    </div>
  );
}
