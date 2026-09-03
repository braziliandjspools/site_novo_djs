"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { ChevronDown, FolderOpen, Loader2, MonitorDown, Volume2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { displayFolderName } from "../../lib/vip-music-slugs";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import { sendFolderToDownloader } from "../lib/send-to-downloader";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { VipMusicTrackList } from "./VipMusicTrackList";
type StyleFolderAccordionProps = {
  folder: VipMusicFolder;
  canPlay: boolean;
  canDownload: boolean;
  relativePath?: string;
  monthSlug?: string;
  monthName?: string;
  weekSlug?: string;
  isNew?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  highlightTrackId?: string;
  autoPlayTrackId?: string;
  scrollIntoView?: boolean;
};

type TracksResponse = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  hasMore: boolean;
  canPlay: boolean;
  canDownload: boolean;
};

export function StyleFolderAccordion({
  folder,
  canPlay,
  canDownload,
  relativePath,
  monthSlug,
  monthName,
  weekSlug,
  isNew = false,
  isOpen,
  onToggle,
  highlightTrackId,
  autoPlayTrackId,
  scrollIntoView = false,
}: StyleFolderAccordionProps) {
  const { authenticated, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const { isFolderPlaying, setFolderPlayback } = useVipMusicPlayer();
  const isPlayingFolder = isFolderPlaying(folder.id);
  const [tracks, setTracks] = useState<PreviewTrack[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingFolder, setSendingFolder] = useState(false);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          folderId: folder.id,
          folderName: folder.name,
          page: String(nextPage),
          limit: "50",
        });
        const res = await fetch(`/api/musicas/tracks?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as TracksResponse & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar faixas.");

        setTracks((prev) => (append ? [...prev, ...data.tracks] : data.tracks));
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar faixas.");
      } finally {
        setLoading(false);
      }
    },
    [folder.id, folder.name],
  );

  useEffect(() => {
    if (isOpen && !loaded && !loading) {
      void loadPage(1, false);
    }
  }, [isOpen, loaded, loading, loadPage]);

  useEffect(() => {
    if (!highlightTrackId || !loaded || loading || !hasMore) return;
    const found = tracks.some((track) => track.id === highlightTrackId);
    if (!found) {
      void loadPage(page + 1, true);
    }
  }, [highlightTrackId, loaded, loading, tracks, hasMore, page, loadPage]);

  useEffect(() => {
    if (!highlightTrackId || !loaded) return;
    const timer = setTimeout(() => {
      document.getElementById(`track-${highlightTrackId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => clearTimeout(timer);
  }, [highlightTrackId, loaded, tracks]);

  useEffect(() => {
    if (!scrollIntoView || !isOpen) return;
    const timer = setTimeout(() => {
      document.getElementById(`style-folder-${folder.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollIntoView, isOpen, folder.id]);

  const loadMoreRef = useRef<() => Promise<void>>(async () => {});

  loadMoreRef.current = async () => {
    if (hasMore && !loading) {
      await loadPage(page + 1, true);
    }
  };

  useEffect(() => {
    if (!loaded) return;
    setFolderPlayback(folder.id, {
      tracks,
      hasMore,
      loadMore: async () => loadMoreRef.current(),
    });
  }, [folder.id, tracks, hasMore, loaded, setFolderPlayback]);

  function handleToggle() {
    if (!isOpen && !loaded) {
      void loadPage(1, false);
    }
    onToggle();
  }

  async function handleSendFolderToDownloader(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (sendingFolder) return;

    if (!authenticated) {
      openLogin();
      return;
    }
    if (!canDownload) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return;
    }

    setSendingFolder(true);
    try {
      const result = await sendFolderToDownloader({
        folderId: folder.id,
        folderName: folder.name,
        relativePath,
        target: sync?.selectedTarget,
        devices: sync?.devices,
      });
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader`,
      );
      await sync?.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSendingFolder(false);
    }
  }

  const label = displayFolderName(folder.name);

  return (
    <div
      id={`style-folder-${folder.id}`}
      className={`overflow-hidden border bg-black ${
        isNew ? "border-[#1ed760]/50 shadow-[0_0_0_1px_rgba(30,215,96,0.15)]" : "border-zinc-800/90"
      }`}
    >
      <div
        className={`group flex w-full items-center gap-2 border-l-2 px-2.5 py-2 transition-colors sm:px-3 ${
          isPlayingFolder
            ? "border-l-[#00ff9d] bg-zinc-950"
            : isOpen
              ? "border-l-[#00ff9d] bg-zinc-950/80"
              : isNew
                ? "border-l-[#1ed760] bg-[#1ed760]/5 hover:bg-[#1ed760]/10"
                : "border-l-transparent bg-black hover:border-l-[#00ff9d]/60 hover:bg-zinc-950/50"
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 flex-shrink-0 text-[#00ff9d] transition-transform duration-150 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
          {isPlayingFolder ? (
            <Volume2 className="h-3.5 w-3.5 flex-shrink-0 text-[#00ff9d] animate-pulse" />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-[#00ff9d]/80 group-hover:text-[#00ff9d]" />
          )}
          <span
            className={`min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.12em] ${
              isPlayingFolder || isOpen ? "text-[#00ff9d]" : "text-zinc-200"
            }`}
          >
            {label}
          </span>
          {isNew && !isPlayingFolder && (
            <span className="flex-shrink-0 rounded-sm bg-[#1ed760] px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.12em] text-black">
              Novo
            </span>
          )}
          {isPlayingFolder && (
            <span className="flex-shrink-0 border border-[#00ff9d]/50 px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.12em] text-[#00ff9d]">
              ON
            </span>
          )}
          {loaded && (
            <span className="flex-shrink-0 text-[10px] font-semibold tabular-nums text-zinc-500">{total}</span>
          )}
          {loading && !loaded && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00ff9d]" />}
        </button>
        {canDownload && (
          <button
            type="button"
            onClick={(event) => void handleSendFolderToDownloader(event)}
            disabled={sendingFolder}
            title="Enviar pasta inteira para o Downloader"
            aria-label={`Enviar pasta ${label} para o Downloader`}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-[#1ed760] disabled:opacity-50"
          >
            {sendingFolder ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MonitorDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="min-h-0 overflow-hidden border-t border-zinc-800/80 bg-[#121212]">
          <div className="p-0.5">
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">{error}</p>
            )}
            {loading && !loaded && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            )}
            {loaded && tracks.length === 0 && !loading && (
              <p className="py-6 text-center text-sm text-[#727272]">Nenhuma faixa nesta pasta.</p>
            )}
            {loaded && tracks.length > 0 && (
              <VipMusicTrackList
                folderId={folder.id}
                tracks={tracks}
                canPlay={canPlay}
                canDownload={canDownload}
                relativePath={relativePath}
                highlightTrackId={highlightTrackId}
                autoPlayTrackId={autoPlayTrackId}
                continueContext={
                  monthSlug && monthName
                    ? {
                        monthSlug,
                        monthName,
                        weekSlug,
                        styleName: displayFolderName(folder.name),
                      }
                    : undefined
                }
              />
            )}
            {hasMore && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadPage(page + 1, true)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-zinc-800 bg-black py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:bg-zinc-950 hover:text-zinc-300 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Carregar mais 50
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
