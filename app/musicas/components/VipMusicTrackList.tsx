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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  HelpCircle,
  ListPlus,
  Loader2,
  Lock,
  MonitorDown,
  Pause,
  Play,
  Search,
  Share2,
  Square,
  X,
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
import { folderHref, parseUpdateDateFolder, slugifyFolderName, slugifyStyleName } from "../../lib/vip-music-slugs";
import { formatStyleNameForDisplay } from "../../lib/style-display";
import type { VipMusicSearchHit } from "../../lib/vip-music-search";
import { hitHref } from "../atualizacoes/AtualizacoesSearchContext";
import { isSendNowFileId } from "../../lib/send-now";
import { CollectionContextMenu, type CollectionMenuAction } from "./CollectionContextMenu";
import { TrackListPagination } from "./TrackListPagination";
import { MusicasTableLoadingOverlay, MusicasToastLoading } from "./MusicasSkeletons";
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

function GoogleDriveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#00832d" d="M7.7 3.5h6.6L7.7 14.1l-3.3 5.7L1.1 14.1z" />
      <path fill="#ffba00" d="M7.7 3.5h6.6l8.6 14.9h-6.6z" />
      <path fill="#0066da" d="M4.4 19.8l3.3-5.7h14.9l-3.3 5.7z" />
    </svg>
  );
}

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
  onPrepareLoadMore?: () => void;
  page?: number;
  pageCount?: number;
  pageLoading?: boolean;
  onPageChange?: (page: number) => void;
  /** Mostra acesso ao Drive somente nas pastas finais/estilos. */
  showDriveButton?: boolean;
  /** Pools da pasta inteira, mesmo os que ainda não têm faixa carregada. */
  filterPools?: { slug: string; name: string }[];
  /** Estilos da pasta inteira, mesmo os que ainda não têm faixa carregada. */
  filterStyles?: { slug: string; name: string }[];
  /** Dias de atualização (antes na sidebar). */
  updateDays?: { slug: string; label: string }[];
  /** A busca do acervo ainda não terminou; não tratar filtro vazio como resultado final. */
  catalogLoading?: boolean;
}

function trackCatalogSlugs(track: PreviewTrack) {
  const pool = track.poolName?.trim() ? slugifyFolderName(track.poolName) : "";
  const style = track.styleName?.trim() ? slugifyStyleName(track.styleName) : "";
  return { pool, style };
}

function foldSearch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

function matchesCatalogFilter(
  track: PreviewTrack,
  poolSlug: string,
  styleSlug: string,
  dayKey: string,
) {
  if (dayKey && track.updateDate !== dayKey) return false;
  const slugs = trackCatalogSlugs(track);
  if (poolSlug && slugs.pool !== poolSlug) return false;
  if (styleSlug && slugs.style !== styleSlug) return false;
  return true;
};

const STREAM_DESKTOP_GRID = "tablemusic-grid";
const STREAM_DESKTOP_GRID_SELECT = "tablemusic-grid tablemusic-grid-select";

function TableMusicHeader({ selectionMode }: { selectionMode: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 md:hidden" aria-hidden>
        <span>Música</span><span>Ações</span>
      </div>
      <div className={`${selectionMode ? STREAM_DESKTOP_GRID_SELECT : STREAM_DESKTOP_GRID} tablemusic-head`} aria-hidden>
        {selectionMode ? <span /> : null}
        <span />
        <span>Música</span>
        <span className="tablemusic-pool">Pool</span>
        <span className="tablemusic-style">Estilo</span>
        <span className="col-span-4 text-center">Download / ações</span>
      </div>
    </>
  );
}

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
          className="brs-eq-bar w-[2px] rounded-full bg-[#60cdff]"
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
    ? "border-[#60cdff]/50 bg-[#60cdff]/20 text-[#60cdff]"
    : isError
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : isBusyState
        ? "border-[#60cdff]/40 bg-[#60cdff]/10 text-[#60cdff]"
        : "border-[#60cdff]/40 bg-[#60cdff]/10 text-[#60cdff] hover:bg-[#60cdff]/20";

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
          active ? "text-[#60cdff]" : "text-white"
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
  onPoolFilter?: (slug: string) => void;
  onStyleFilter?: (slug: string) => void;
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
  onPoolFilter,
  onStyleFilter,
}: StreamingRowProps) {
  const display = getTrackDisplayMetadata(track);
  const artistLabel = display.artist.replace(/^[\s\-–—:]+/, "").trim();
  const a11yName = `${display.title}. ${artistLabel}`;
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
      let url = "";
      if (format === "drive") {
        if (!track.poolFolderId) {
          throw new Error("Esta faixa não possui uma Pool vinculada à data.");
        }
        // O ícone do Drive representa a Pool inteira daquela data, não a faixa individual.
        url = `https://drive.google.com/drive/folders/${encodeURIComponent(track.poolFolderId)}`;
        await copyToClipboard(url);
        showToast("Link da Pool no Google Drive copiado");
      } else {
        const response = await fetch(`/api/musicas/drive/${encodeURIComponent(track.id)}/link?format=direct`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || "Link de download indisponível.");
        await copyToClipboard(result.url);
        showToast("Link direto copiado. Válido por 2 horas.");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível copiar o link do Drive.", "error");
    } finally {
      setCopyingDrive(false);
    }
  }, [copyingDrive, gmailDriveAllowed, showToast, track.id, track.poolFolderId]);

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
        label: "Copiar link direto",
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
    if (showDriveButton && track.poolFolderId && authenticated && hasVip) {
      extras.push(gmailDriveAllowed
        ? { id: "drive", label: "Copiar link do Google Drive", renderIcon: <GoogleDriveIcon />, disabled: copyingDrive, onClick: () => void copyDriveLink("drive") }
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
          <Loader2 className="h-4 w-4 animate-spin text-[#60cdff]" />
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
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[#60cdff] transition-colors group-hover/locked:bg-black/70">
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
        <span className="flex min-w-0 items-center gap-2">
          <MobilePlayingTitle title={display.title} active={isPlaying} />
          {track.source === "sendnow" ? (
            <span className="inline-flex shrink-0 rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/55 sm:inline">
              SEND.NOW
            </span>
          ) : null}
        </span>
        <span
          className={`hidden truncate text-[12px] font-semibold leading-snug tracking-[-0.02em] transition-colors duration-200 sm:text-[13px] md:block ${
            isActive || isPlaying ? "text-[#60cdff]" : "text-white"
          }`}
        >
          {display.title}
        </span>
      </p>
      {isRecentlyAdded ? <span className="mt-1 inline-flex rounded border border-[#60cdff]/40 bg-[#60cdff]/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#86efac]">Nova</span> : null}
      <ArtistNameLink
        artist={artistLabel}
        className="mt-0.5 block whitespace-normal break-words text-[12px] leading-snug text-white/50"
      />
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] md:hidden">
        {track.poolName?.trim() ? (
          <span className="min-w-0 max-w-[48%] truncate text-sky-200" title={track.poolName.trim()}>
            {track.poolName.trim()}
          </span>
        ) : null}
        {track.poolName?.trim() && track.styleName?.trim() ? (
          <span className="shrink-0 text-white/20" aria-hidden>•</span>
        ) : null}
        {track.styleName?.trim() ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onStyleFilter?.(slugifyStyleName(track.styleName!.trim()));
            }}
            className="min-w-0 max-w-[48%] truncate text-left text-[#86e7a7] transition hover:text-white"
            title={`Abrir estilo: ${formatStyleNameForDisplay(track.styleName)}`}
          >
            {formatStyleNameForDisplay(track.styleName)}
          </button>
        ) : null}
      </div>
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
              className="relative h-full rounded-sm bg-[#60cdff]"
              style={{ width: `${Math.min(100, progress)}%` }}
            >
              <span className="absolute -right-1 top-1/2 h-3 w-2 -translate-y-1/2 rounded-sm bg-[#a7ffc6] shadow-[0_0_8px_rgba(96,205,255,0.6)] sm:h-2.5" />
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
            ? "border-[#60cdff] bg-[#60cdff] text-black"
            : "border-white/25 bg-black/20 text-transparent hover:border-white/45"
        }`}
      >
        {isSelected ? <Check className="h-3.5 w-3.5 md:h-3 md:w-3" strokeWidth={3} /> : null}
      </button>
    ) : null;

  return (
    <article
      id={isHighlighted && setDomAnchor ? `track-${track.id}` : undefined}
      className={`tablemusic-row group/row relative hover:z-10 focus-within:z-10 after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#60cdff]/20 after:to-transparent last:after:hidden transition-[background-color,box-shadow] duration-200 ease-out ${rowBg} ${
        isActive || isPlaying || isSelected || isHighlighted
          ? "shadow-[inset_3px_0_0_0_#60cdff]"
          : "hover:shadow-[inset_3px_0_0_0_rgba(96,205,255,0.55)]"
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

      {/* Desktop: aligned columns share the same grid as the table header. */}
      <div
        className={`${selectionMode && canDownload ? STREAM_DESKTOP_GRID_SELECT : STREAM_DESKTOP_GRID} px-3.5 py-2.5`}
      >
        {selectionMode && canDownload ? (
          <div className="flex items-center justify-center">{selectCheckbox}</div>
        ) : null}
        <div className="relative flex items-center justify-center">
          {playButton}
        </div>

        <div className="min-w-0 py-0.5">
          {titleBlock}
          {progressBlock}
        </div>
        <div className="tablemusic-pool min-w-0">
          <button
            type="button"
            disabled={!track.poolName?.trim()}
            onClick={(event) => {
              event.stopPropagation();
              onPoolFilter?.(track.poolName?.trim() ? slugifyFolderName(track.poolName) : "");
            }}
            className="block max-w-full truncate text-left text-xs font-medium text-sky-200 transition hover:text-white disabled:cursor-default disabled:opacity-60"
            title={track.poolName?.trim() ? `Filtrar pool: ${track.poolName.trim()}` : "Pool não informado"}
          >
            {track.poolName?.trim() || "—"}
          </button>
        </div>
        <div className="tablemusic-style min-w-0">
          <button
            type="button"
            disabled={!track.styleName?.trim()}
            onClick={(event) => {
              event.stopPropagation();
              onStyleFilter?.(track.styleName?.trim() ? slugifyStyleName(track.styleName) : "");
            }}
            className="block max-w-full truncate text-left text-xs font-medium text-[#86e7a7] transition hover:text-white disabled:cursor-default disabled:opacity-60"
            title={track.styleName?.trim() ? `Filtrar estilo: ${formatStyleNameForDisplay(track.styleName)}` : "Estilo não informado"}
          >
            {track.styleName?.trim() ? formatStyleNameForDisplay(track.styleName) : "—"}
          </button>
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
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-[#60cdff]/40 hover:text-white disabled:opacity-60"
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
          {showDriveButton && track.poolFolderId && authenticated && hasVip ? (
            gmailDriveAllowed ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void copyDriveLink("drive");
                }}
                disabled={copyingDrive}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#60cdff]/30 bg-[#60cdff]/10 text-[#60cdff] transition hover:bg-[#60cdff]/20 disabled:opacity-50"
                title={`Copiar link do Google Drive de ${display.title}`}
                aria-label={`Copiar link do Google Drive de ${display.title}`}
              >
                {copyingDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GoogleDriveIcon className="h-4 w-4" />}
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
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#60cdff]" />
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
              <span className={isPlaying || isActive ? "text-[#60cdff]" : "text-white"}>
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
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[#60cdff] transition-colors group-hover/locked:bg-black/70">
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
  onPrepareLoadMore,
  page = 1,
  pageCount = 1,
  pageLoading = false,
  onPageChange,
  showDriveButton = false,
  filterPools,
  filterStyles,
  updateDays = [],
  catalogLoading = false,
}: VipMusicTrackListProps) {
  const { authenticated, openLogin } = useMusicasSession();

  useEffect(() => {
    if (!hasMore || !onPrepareLoadMore) return;
    onPrepareLoadMore();
  }, [hasMore, onPrepareLoadMore]);
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [browserConfirmOpen, setBrowserConfirmOpen] = useState(false);
  const [durationById, setDurationById] = useState<Record<string, number>>({});
  const [markPickerOpen, setMarkPickerOpen] = useState(false);
  const [pickerPool, setPickerPool] = useState("");
  const [pickerStyle, setPickerStyle] = useState("");
  const [markRule, setMarkRule] = useState<{ pool: string; style: string } | null>(null);
  const skippedMarkIds = useRef(new Set<string>());
  const appliedMarkIds = useRef(new Set<string>());
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const poolFilterSlug = searchParams.get("pool") ?? "";
  const styleFilterSlug = searchParams.get("estilo") ?? "";
  const dayFilterKey = searchParams.get("dia") ?? "";
  const searchQuery = searchParams.get("busca") ?? "";
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const [submittedTableSearch, setSubmittedTableSearch] = useState("");
  const [tableSearchResults, setTableSearchResults] = useState<VipMusicSearchHit[]>([]);
  const [tableSearchLoading, setTableSearchLoading] = useState(false);
  const [tableSearchError, setTableSearchError] = useState<string | null>(null);

  const writeCatalogQuery = useCallback(
    (next: { pool?: string; style?: string; busca?: string; dia?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.pool !== undefined) {
        if (next.pool) params.set("pool", next.pool);
        else params.delete("pool");
      }
      if (next.style !== undefined) {
        if (next.style) params.set("estilo", next.style);
        else params.delete("estilo");
      }
      if (next.busca !== undefined) {
        const value = next.busca.trim();
        if (value) params.set("busca", value);
        else params.delete("busca");
      }
      if (next.dia !== undefined) {
        if (next.dia) params.set("dia", next.dia);
        else params.delete("dia");
      }
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const writeCatalogFilters = useCallback(
    (pool: string, style: string) => {
      writeCatalogQuery({ pool, style });
    },
    [writeCatalogQuery],
  );

  useEffect(() => {
    setSearchDraft(new URLSearchParams(window.location.search).get("busca") ?? "");
  }, [folderId]);

  const autoPlayedRef = useRef<string | null>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;
  const isThisFolder = playingFolderId === folderId;
  const isGlobalBusy = loadingId !== null;
  // A tabela é uma lista contínua: não cria blocos separados por data.
  const shouldGroupByDate = groupByDate ?? false;

  const trackSections = useMemo(
    () => (shouldGroupByDate ? groupTracksByUploadDate(tracks) : null),
    [shouldGroupByDate, tracks],
  );

  const filterOptions = useMemo(() => {
    const pools = new Map<string, string>();
    const styles = new Map<string, string>();

    for (const option of filterPools ?? []) {
      if (option.slug && option.name) pools.set(option.slug, option.name);
    }
    for (const option of filterStyles ?? []) {
      if (option.slug && option.name) styles.set(option.slug, option.name);
    }
    for (const track of tracks) {
      const pool = track.poolName?.trim();
      const style = track.styleName?.trim();
      // Sem ID de pasta de Pool, não há Pool real para filtrar.
      // Isso evita que um estilo de uma estrutura sem Pool apareça como Pool.
      if (pool) pools.set(slugifyFolderName(pool), pool);
      if (style) styles.set(slugifyStyleName(style), style);
    }
    if (poolFilterSlug && !pools.has(poolFilterSlug)) pools.set(poolFilterSlug, poolFilterSlug);
    if (styleFilterSlug && !styles.has(styleFilterSlug)) styles.set(styleFilterSlug, styleFilterSlug);

    return {
      pools: [...pools.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
      styles: [...styles.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")),
    };
  }, [filterPools, filterStyles, poolFilterSlug, styleFilterSlug, tracks]);

  // Os filtros de Dia/Pool/Estilo continuam filtrando as faixas carregadas.
  // A busca textual da tabela só é aplicada depois que o usuário confirma a pesquisa.
  const filteredTracks = useMemo(() => {
    const query = foldSearch(searchDraft.trim());
    return tracks.filter((track) => {
      if (!matchesCatalogFilter(track, poolFilterSlug, styleFilterSlug, dayFilterKey)) return false;
      if (!query || query !== foldSearch(submittedTableSearch)) return true;
      const display = getTrackDisplayMetadata(track);
      const haystack = foldSearch(
        [display.title, display.artist, track.poolName, track.styleName, track.fileName, track.title]
          .filter(Boolean)
          .join(" "),
      );
      return haystack.includes(query);
    });
  }, [dayFilterKey, poolFilterSlug, searchDraft, styleFilterSlug, submittedTableSearch, tracks]);

  const submitTableSearch = useCallback(() => {
    const q = searchDraft.trim();
    if (q.length < 2) {
      setSubmittedTableSearch("");
      setTableSearchResults([]);
      setTableSearchError("Digite pelo menos 2 caracteres para pesquisar.");
      return;
    }

    setTableSearchLoading(true);
    setTableSearchError(null);
    setSubmittedTableSearch(q);
    setTableSearchResults([]);

    void fetch(`/api/musicas/search?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const raw = await res.text();
        let data: { results?: VipMusicSearchHit[]; error?: string } = {};
        try {
          data = raw ? (JSON.parse(raw) as { results?: VipMusicSearchHit[]; error?: string }) : {};
        } catch {
          throw new Error("Resposta inválida da busca.");
        }
        if (!res.ok) throw new Error(data.error ?? "Busca indisponível.");
        const results = (data.results ?? []).filter((hit) => hit.type === "track");
        setTableSearchResults(results);
      })
      .catch((err: unknown) => {
        setTableSearchError(err instanceof Error ? err.message : "Busca indisponível.");
        setTableSearchResults([]);
      })
      .finally(() => {
        setTableSearchLoading(false);
      });
  }, [searchDraft]);

  const visibleTrackSections = useMemo(
    () => (shouldGroupByDate ? groupTracksByUploadDate(filteredTracks) : null),
    [shouldGroupByDate, filteredTracks],
  );
  const orderedTracks = useMemo(
    () => (shouldGroupByDate ? flattenTrackSections(groupTracksByUploadDate(filteredTracks)) : filteredTracks),
    [shouldGroupByDate, filteredTracks],
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
      if (next.has(trackId)) {
        next.delete(trackId);
        skippedMarkIds.current.add(trackId);
      } else {
        next.add(trackId);
        skippedMarkIds.current.delete(trackId);
      }
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setMarkRule(null);
    skippedMarkIds.current = new Set();
    appliedMarkIds.current = new Set();
  }, []);

  const openMarkPicker = useCallback(() => {
    setPickerPool(poolFilterSlug);
    setPickerStyle(styleFilterSlug);
    setMarkPickerOpen(true);
    setSelectionMode(true);
  }, [poolFilterSlug, styleFilterSlug]);

  const confirmMarkPicker = useCallback(() => {
    skippedMarkIds.current = new Set();
    appliedMarkIds.current = new Set();
    setMarkRule({ pool: pickerPool, style: pickerStyle });
    setSelectionMode(true);
    setMarkPickerOpen(false);
    if (pickerPool !== poolFilterSlug || pickerStyle !== styleFilterSlug) {
      writeCatalogFilters(pickerPool, pickerStyle);
    }
  }, [pickerPool, pickerStyle, poolFilterSlug, styleFilterSlug, writeCatalogFilters]);

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

  useEffect(() => {
    if (!markRule) return;
    const pending = tracks.filter((track) => !appliedMarkIds.current.has(track.id));
    if (pending.length === 0) return;
    for (const track of pending) appliedMarkIds.current.add(track.id);
    setSelectedIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const track of pending) {
        if (skippedMarkIds.current.has(track.id)) continue;
        if (!matchesCatalogFilter(track, markRule.pool, markRule.style, dayFilterKey)) continue;
        if (!next.has(track.id)) {
          next.add(track.id);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [dayFilterKey, markRule, tracks]);

  const drainLengthRef = useRef<number | null>(null);
  useEffect(() => {
    const shouldDrain = markPickerOpen || markRule !== null;
    if (!shouldDrain) {
      drainLengthRef.current = null;
      return;
    }
    if (onPageChange) return;
    if (!hasMore || !onLoadMore || drainLengthRef.current === tracks.length) return;
    drainLengthRef.current = tracks.length;
    void onLoadMore();
  }, [hasMore, markPickerOpen, markRule, onLoadMore, onPageChange, tracks.length]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !onLoadMore) return;
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const copyTrackLink = useCallback(
    (track: PreviewTrack) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("faixa", track.id);
      const qs = params.toString();
      const url = typeof window !== "undefined" ? `${window.location.origin}${pathname}?${qs}` : "";
      void navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link copiado"))
        .catch(() => showToast("Não foi possível copiar o link.", "error"));
    },
    [pathname, searchParams, showToast],
  );

  const shareTrack = useCallback(
    async (track: PreviewTrack) => {
      const display = getTrackDisplayMetadata(track);
      const params = new URLSearchParams(searchParams.toString());
      params.set("faixa", track.id);
      const url = typeof window !== "undefined" ? `${window.location.origin}${pathname}?${params.toString()}` : "";
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
    [pathname, searchParams, showToast],
  );

  const dayOptions = useMemo(() => {
    return updateDays
      .map((day) => {
        const key =
          parseUpdateDateFolder(day.label)?.key ||
          parseUpdateDateFolder(day.slug)?.key ||
          day.slug;
        return { key, label: day.label };
      })
      .filter((day, index, list) => list.findIndex((item) => item.key === day.key) === index);
  }, [updateDays]);

  if (tracks.length === 0) return null;

  const useStreaming = layout === "table" || layout === "default";
  const useDiscography = layout === "discography";
  const separateByFolderDate = Boolean(
    visibleTrackSections?.length && shouldGroupByDate,
  );
  const panelClass = layout === "table"
    ? "musicas-track-panel overflow-hidden !rounded-none border border-[#60cdff]/15 bg-[#202020] shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
    : "musicas-track-panel rounded-2xl border border-white/10 bg-[#101210] shadow-[0_18px_40px_rgba(0,0,0,0.35)]";
  const hasCatalogFilters =
    useStreaming && (dayOptions.length > 0 || filterOptions.pools.length > 0 || filterOptions.styles.length > 0);

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
          showDriveButton={showDriveButton && !isSendNowFileId(track.id) && /^[a-zA-Z0-9_-]+$/.test(track.id)}
          onPoolFilter={(slug) => writeCatalogQuery({ pool: slug, style: "" })}
          onStyleFilter={(slug) => writeCatalogQuery({ style: slug })}
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#60cdff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
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
              onClick={openMarkPicker}
              className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-[#60cdff]/35 hover:bg-[#60cdff]/10 hover:text-[#60cdff]"
            >
              Marcar pool/estilo
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
            onClick={openMarkPicker}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-[#60cdff]/35 hover:bg-[#60cdff]/10 hover:text-[#60cdff]"
          >
            <Check className="h-3 w-3" />
            Selecionar faixas
          </button>
        )}
      </div>
    ) : null;

  const listFooter = (isLastSection: boolean) => {
    if (!isLastSection) return null;
    if (onPageChange && pageCount > 1) {
      return (
        <TrackListPagination
          page={page}
          pageCount={pageCount}
          loading={pageLoading || loadingMore}
          onPageChange={onPageChange}
        />
      );
    }
    if (!embedded || !useStreaming || !hasMore || !onLoadMore) return null;
    return (
      <div className="flex justify-center border-t border-white/[0.06] bg-[#111] px-3 py-3 sm:px-4">
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void handleLoadMore()}
          onMouseEnter={onPrepareLoadMore}
          onFocus={onPrepareLoadMore}
          className="mx-auto inline-flex min-h-10 min-w-[180px] items-center justify-center gap-2 rounded-md border border-[#60cdff]/35 bg-[#60cdff]/10 px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#60cdff] transition-colors hover:border-[#60cdff]/60 hover:bg-[#60cdff]/20 disabled:cursor-wait disabled:opacity-50"
        >
          {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loadingMore ? "CARREGANDO..." : "LOAD MORE"}
        </button>
      </div>
    );
  };

  return (
    <div className={`relative ${separateByFolderDate ? "space-y-4" : embedded ? "" : panelClass}`}>
      {pageLoading ? (
        <MusicasTableLoadingOverlay label={`Carregando página ${String(page).padStart(2, "0")}…`} />
      ) : null}
      {useStreaming ? (
        <div className="space-y-3 border-b border-white/10 bg-[#202020] px-3 py-3 sm:px-4">
          {hasCatalogFilters ? (
            <div className="rounded-xl border border-[#60cdff]/20 bg-black/40 p-3">
              <p className="mb-3 text-[11px] leading-relaxed text-white/45">
                À medida que você navega pelas músicas, novas <span className="font-semibold text-white/65">Pools</span> e <span className="font-semibold text-white/65">Estilos</span> encontrados serão adicionados automaticamente aos filtros.
              </p>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#60cdff]">Filtros</p>
                {poolFilterSlug || styleFilterSlug || dayFilterKey ? (
                  <button
                    type="button"
                    onClick={() => writeCatalogQuery({ pool: "", style: "", dia: "" })}
                    className="text-[11px] font-semibold text-white/50 transition hover:text-white"
                  >
                    Limpar filtros
                  </button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {dayOptions.length > 0 ? (
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                      Dia
                    </span>
                    <select
                      value={dayFilterKey}
                      onChange={(event) =>
                        writeCatalogQuery({ dia: event.target.value, pool: "", style: "" })
                      }
                      className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#171717] px-3 text-sm text-white outline-none focus:border-[#60cdff]/50"
                    >
                      <option value="">Mês inteiro</option>
                      {dayOptions.map((day) => (
                        <option key={day.key} value={day.key}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {filterOptions.pools.length > 0 ? (
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                      Pool
                    </span>
                    <select
                      value={poolFilterSlug}
                      onChange={(event) =>
                        writeCatalogQuery({ pool: event.target.value, style: "" })
                      }
                      className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#171717] px-3 text-sm text-white outline-none focus:border-[#60cdff]/50"
                    >
                      <option value="">Todos os pools</option>
                      {filterOptions.pools.map(([slug, name]) => (
                        <option key={slug} value={slug}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {filterOptions.styles.length > 0 ? (
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                      Estilo
                    </span>
                    <select
                      value={styleFilterSlug}
                      onChange={(event) => writeCatalogQuery({ style: event.target.value })}
                      className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#171717] px-3 text-sm text-white outline-none focus:border-[#60cdff]/50"
                    >
                      <option value="">Todos os estilos</option>
                      {filterOptions.styles.map(([slug, name]) => (
                        <option key={slug} value={slug}>
                          {formatStyleNameForDisplay(name)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              submitTableSearch();
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60cdff]" aria-hidden />
            <input
              type="text"
              value={searchDraft}
              onChange={(event) => {
                const value = event.target.value;
                setSearchDraft(value);
                writeCatalogQuery({ busca: value });
              }}
              placeholder="Buscar nesta tabela"
              aria-label="Buscar nesta tabela"
              className="w-full rounded-xl border border-white/10 bg-black py-2.5 pl-10 pr-10 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#60cdff]/60"
            />
            {searchDraft ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchDraft("");
                  writeCatalogQuery({ busca: "" });
                }}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="submit"
              disabled={tableSearchLoading || searchDraft.trim().length < 2}
              className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-[#60cdff] px-3 text-[10px] font-black uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tableSearchLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Pesquisar
            </button>
          </form>
        </div>
      ) : null}
      {useStreaming && submittedTableSearch ? (
        <div className="border-b border-white/[0.06] bg-[#151515] px-3 py-3 sm:px-4">
          {tableSearchLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#60cdff]" />
              <span>Pesquisando em todo o acervo…</span>
            </div>
          ) : tableSearchError ? (
            <p className="py-4 text-center text-sm text-red-400">{tableSearchError}</p>
          ) : tableSearchResults.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Resultados para “{submittedTableSearch}” · {tableSearchResults.length}
              </p>
              <div className="space-y-1">
                {tableSearchResults.map((hit) => (
                  <a
                    key={`table-search-${hit.id}`}
                    href={hitHref(hit)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                  >
                    <Music2 className="h-4 w-4 flex-shrink-0 text-[#60cdff]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{hit.label}</span>
                      <span className="block truncate text-[10px] text-zinc-500">{hit.path}</span>
                    </span>
                    {hit.page ? (
                      <span className="flex-shrink-0 text-[10px] font-semibold text-[#60cdff]">
                        Página {hit.page}{hit.totalPages ? ` de ${hit.totalPages}` : ""}
                      </span>
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-5 text-center text-sm text-zinc-500">
              Nenhuma música encontrada para “{submittedTableSearch}”.
            </p>
          )}
        </div>
      ) : null}

      {useStreaming && (searchDraft.trim() || poolFilterSlug || styleFilterSlug || dayFilterKey) && filteredTracks.length === 0 ? (
        catalogLoading || loadingMore || pageLoading ? (
          <div className="flex justify-center px-4 py-10">
            <MusicasToastLoading label="Pesquisando as músicas…" />
          </div>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-zinc-400">
            {searchDraft.trim()
              ? `Nenhuma música encontrada para “${searchDraft.trim()}”.`
              : "Nenhuma música neste filtro."}
          </p>
        )
      ) : null}
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

      {useStreaming && separateByFolderDate && filteredTracks.length > 0 && trackSections ? (
        <>
          {selectionToolbar ? (
            <div className={`${panelClass} !shadow-none`}>{selectionToolbar}</div>
          ) : null}
          {visibleTrackSections?.map((section, sectionIndex, sections) => (
            <div key={section.id} className={panelClass}>
              <header className="flex items-stretch justify-between border-b border-white/10 bg-[#161616]">
                <h3 className="inline-flex items-center bg-[#60cdff] px-3 py-2 text-[12px] font-extrabold tabular-nums tracking-[0.08em] text-black">
                  {section.title}
                </h3>
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {section.tracks.length} {section.tracks.length === 1 ? "faixa" : "faixas"}
                </p>
              </header>
              <div className="tablemusic">
                <TableMusicHeader selectionMode={selectionMode && canDownload} />
                {renderStreamingRows(section.tracks)}
              </div>
              {listFooter(sectionIndex === sections.length - 1)}
            </div>
          ))}
        </>
      ) : null}

      {useStreaming && !separateByFolderDate && filteredTracks.length > 0 ? (
        <div>
          {selectionToolbar}
          {(visibleTrackSections ?? [
            { id: "all", title: "", subtitle: "", isNew: false, kind: "upload" as const, tracks: filteredTracks },
          ]).map((section, sectionIndex, sections) => (
            <section key={section.id} className="border-b border-white/[0.05] last:border-b-0">
              {trackSections && section.title ? (
                <header className="flex items-stretch justify-between border-b border-white/10 bg-[#161616]">
                  <h3 className="inline-flex items-center gap-2 bg-[#60cdff] px-3 py-2 text-[12px] font-extrabold tabular-nums tracking-[0.08em] text-black">
                    {section.isNew ? (
                      <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-black tracking-[0.14em] text-[#60cdff]">
                        NEW
                      </span>
                    ) : null}
                    {section.title}
                  </h3>
                  {section.subtitle ? (
                    <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      {section.subtitle}
                    </span>
                  ) : null}
                </header>
              ) : null}
              <div className="tablemusic">
                <TableMusicHeader selectionMode={selectionMode && canDownload} />
                {renderStreamingRows(section.tracks)}
              </div>
              {listFooter(sectionIndex === sections.length - 1)}
            </section>
          ))}
        </div>
      ) : null}


      {selectionMode && selectedCount > 0 ? (
        <div className="sticky bottom-0 z-20 hidden flex-wrap items-center gap-2 border-t border-white/[0.08] bg-[#0f1012]/95 px-3.5 py-3 backdrop-blur-md sm:flex">
          <p className="text-xs font-semibold tabular-nums text-white">
            {selectedCount} selecionada{selectedCount === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={() => handleSendSelectedToDownloader()}
            disabled={batchSending || batchDownloading}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#60cdff] px-3.5 py-2 text-xs font-bold text-black disabled:opacity-50"
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

      {markPickerOpen ? (
        <div className="fixed inset-0 z-[10080] flex items-center justify-center bg-black/75 p-4" role="presentation" onClick={() => setMarkPickerOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mark-pool-style-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="mark-pool-style-title" className="text-base font-bold text-white">Marcar faixas</h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Escolha a pool, o estilo ou os dois. As faixas dessa escolha são marcadas conforme a tabela carrega.
            </p>
            <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Pool
              <select
                value={pickerPool}
                onChange={(event) => {
                  const pool = event.target.value;
                  setPickerPool(pool);
                  if (pickerStyle && pool && !tracks.some((track) => {
                    const slugs = trackCatalogSlugs(track);
                    return slugs.pool === pool && slugs.style === pickerStyle;
                  })) {
                    setPickerStyle("");
                  }
                }}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none"
              >
                <option value="">Todas as pools</option>
                {filterOptions.pools.map(([slug, name]) => (
                  <option key={slug} value={slug}>{name}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Estilo
              <select
                value={pickerStyle}
                onChange={(event) => setPickerStyle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none"
              >
                <option value="">Todos os estilos</option>
                {(pickerPool
                  ? filterOptions.styles.filter(([slug]) =>
                      tracks.some((track) => {
                        const slugs = trackCatalogSlugs(track);
                        return slugs.pool === pickerPool && slugs.style === slug;
                      }) || slug === pickerStyle,
                    )
                  : filterOptions.styles
                ).map(([slug, name]) => (
                  <option key={slug} value={slug}>{formatStyleNameForDisplay(name)}</option>
                ))}
              </select>
            </label>
            {hasMore ? (
              <p className="mt-3 text-[11px] text-zinc-500">Carregando mais faixas para completar pools e estilos…</p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setMarkPickerOpen(false)} className="flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                Cancelar
              </button>
              <button type="button" onClick={confirmMarkPicker} className="flex-1 rounded-full bg-[#60cdff] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black">
                Marcar
              </button>
            </div>
          </div>
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
