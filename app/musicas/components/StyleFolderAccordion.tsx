"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, FolderOpen, Loader2, MonitorDown, Volume2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { sendFolderToDownloader, sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { VipMusicTrackList } from "./VipMusicTrackList";
import {
  poolPanelClass,
  poolPanelHeaderClass,
  poolRowBaseClass,
  poolRowTone,
  poolTableHeadClass,
  folderActionSendClass,
} from "./atualizacoes-pool-ui";

type StyleFolderAccordionProps = {
  folder: VipMusicFolder;
  canPlay: boolean;
  canDownload: boolean;
  relativePath?: string;
  monthSlug?: string;
  monthName?: string;
  weekSlug?: string;
  slugSegments?: string[];
  isNew?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  highlightTrackId?: string;
  autoPlayTrackId?: string;
  scrollIntoView?: boolean;
  /** Índice para zebrado preto/cinza quando listado em painel único. */
  zebraIndex?: number;
  /** Sem borda/radius próprios — fica dentro de um painel pai. */
  embedded?: boolean;
  /** Incrementa após sync forçado para recarregar faixas abertas. */
  reloadToken?: number;
};

type TracksResponse = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  hasMore: boolean;
  canPlay: boolean;
  canDownload: boolean;
};

type CatalogResponse = {
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  tracks?: PreviewTrack[];
  error?: string;
};

export function StyleFolderAccordion({
  folder,
  canPlay,
  canDownload,
  relativePath,
  monthSlug,
  monthName,
  weekSlug,
  slugSegments,
  isNew = false,
  isOpen,
  onToggle,
  highlightTrackId,
  autoPlayTrackId,
  scrollIntoView = false,
  zebraIndex = 0,
  embedded = false,
  reloadToken = 0,
}: StyleFolderAccordionProps) {
  const { authenticated, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const { isFolderPlaying, setFolderPlayback } = useVipMusicPlayer();
  const isPlayingFolder = isFolderPlaying(folder.id);
  const [contentMode, setContentMode] = useState<"unknown" | "folders" | "tracks">("unknown");
  const [childFolders, setChildFolders] = useState<VipMusicCatalogItem[]>([]);
  const [tracks, setTracks] = useState<PreviewTrack[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingFolder, setSendingFolder] = useState(false);

  const loadTrackPage = useCallback(
    async (nextPage: number, append: boolean, forceRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          folderId: folder.id,
          folderName: folder.name,
          page: String(nextPage),
          limit: "50",
        });
        if (forceRefresh) params.set("refresh", "1");
        const res = await fetch(`/api/musicas/tracks?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as TracksResponse & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar faixas.");

        setContentMode("tracks");
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

  const loadContents = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        folderId: folder.id,
        folderName: folder.name,
      });
      if (forceRefresh) params.set("refresh", "1");
      const res = await fetch(`/api/musicas/catalog?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as CatalogResponse;
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar pasta.");

      if (data.level === "folders" && data.items.length > 0) {
        setContentMode("folders");
        setChildFolders(data.items);
        const directTracks = data.tracks ?? [];
        setTracks(directTracks);
        setTotal(data.items.length);
        setHasMore(false);
        setLoaded(true);
        setLoading(false);
        return;
      }

      await loadTrackPage(1, false, forceRefresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pasta.");
      setLoading(false);
    }
  }, [folder.id, folder.name, loadTrackPage]);

  useEffect(() => {
    if (isOpen && !loaded && !loading) {
      void loadContents();
    }
  }, [isOpen, loaded, loading, loadContents]);

  useEffect(() => {
    if (!reloadToken || !isOpen) return;
    setLoaded(false);
    setTracks([]);
    setChildFolders([]);
    setContentMode("unknown");
    void loadContents(true);
  }, [reloadToken]); // eslint-disable-line react-hooks/exhaustive-deps -- só reage ao sync

  useEffect(() => {
    if (!highlightTrackId || !loaded || loading || contentMode !== "tracks" || !hasMore) return;
    const found = tracks.some((track) => track.id === highlightTrackId);
    if (!found) {
      void loadTrackPage(page + 1, true);
    }
  }, [highlightTrackId, loaded, loading, contentMode, tracks, hasMore, page, loadTrackPage]);

  useEffect(() => {
    if (!highlightTrackId || !loaded || contentMode !== "tracks") return;
    const timer = setTimeout(() => {
      document.getElementById(`track-${highlightTrackId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => clearTimeout(timer);
  }, [highlightTrackId, loaded, contentMode, tracks]);

  useEffect(() => {
    if (!scrollIntoView || !isOpen) return;
    const timer = setTimeout(() => {
      document.getElementById(`style-folder-${folder.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollIntoView, isOpen, folder.id]);

  const loadMoreRef = useRef<() => Promise<void>>(async () => {});

  loadMoreRef.current = async () => {
    if (contentMode === "tracks" && hasMore && !loading) {
      await loadTrackPage(page + 1, true);
    }
  };

  useEffect(() => {
    if (!loaded || contentMode !== "tracks") return;
    setFolderPlayback(folder.id, {
      tracks,
      hasMore,
      loadMore: async () => loadMoreRef.current(),
    });
  }, [folder.id, tracks, hasMore, loaded, contentMode, setFolderPlayback]);

  const label = displayFolderName(folder.name);
  const folderStatus = parseMonthStatus(folder.name);
  const packSlugSegments =
    slugSegments && slugSegments.length > 0
      ? slugSegments
      : [monthSlug, weekSlug, slugifyFolderName(folder.name)].filter(
          (part): part is string => Boolean(part),
        );

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
      const packSlug = packSlugSegments.join("/");
      const result =
        packSlug.length > 0
          ? await sendPackSlugToDownloader(packSlug, {
              target: sync?.selectedTarget,
              devices: sync?.devices,
            })
          : await sendFolderToDownloader({
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

  function handleToggle() {
    if (!isOpen && !loaded) {
      void loadContents();
    }
    onToggle();
  }

  return (
    <div
      id={`style-folder-${folder.id}`}
      className={
        embedded
          ? `border-b border-zinc-600 last:border-b-0 ${
              folderStatus.status === "em-atualizacao"
                ? "ring-1 ring-inset ring-amber-500/35"
                : isNew
                  ? "ring-1 ring-inset ring-[#1ed760]/35"
                  : ""
            }`
          : `${poolPanelClass} ${
              folderStatus.status === "em-atualizacao"
                ? "border-amber-500/45"
                : isNew
                  ? "border-[#1ed760]/45"
                  : ""
            }`
      }
    >
      <div
        className={`group flex w-full items-center gap-2 px-3 py-2.5 transition-colors sm:px-4 ${
          isPlayingFolder || isOpen
            ? "bg-[#1ed760]/10"
            : poolRowTone(zebraIndex)
        } ${embedded ? "" : "border-b border-zinc-600"}`}
      >
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 flex-shrink-0 text-[#1ed760] transition-transform duration-150 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
          {isPlayingFolder ? (
            <Volume2 className="h-3.5 w-3.5 flex-shrink-0 animate-pulse text-[#1ed760]" />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-[#1ed760]/80 group-hover:text-[#1ed760]" />
          )}
          <span
            className={`min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.12em] ${
              isPlayingFolder || isOpen ? "text-[#1ed760]" : "text-zinc-200"
            }`}
          >
            {label}
          </span>
          {folderStatus.status === "em-atualizacao" && (
            <span className="flex-shrink-0 rounded-sm bg-amber-400 px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.12em] text-black">
              Em atualização
            </span>
          )}
          {isNew && !isPlayingFolder && folderStatus.status !== "em-atualizacao" && (
            <span className="flex-shrink-0 rounded-sm bg-[#1ed760] px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.12em] text-black">
              Novo
            </span>
          )}
          {isPlayingFolder && (
            <span className="flex-shrink-0 border border-[#1ed760]/50 px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.12em] text-[#1ed760]">
              ON
            </span>
          )}
          {loaded && (
            <span className="flex-shrink-0 text-[10px] font-semibold tabular-nums text-zinc-500">
              {contentMode === "folders" ? `${total} pastas` : total}
            </span>
          )}
          {loading && !loaded && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1ed760]" />}
        </button>
        {packSlugSegments.length > 0 && <CopyPackLinkButton slugSegments={packSlugSegments} />}
        {canDownload && (
          <button
            type="button"
            onClick={(event) => void handleSendFolderToDownloader(event)}
            disabled={sendingFolder}
            title="Enviar pasta inteira para o Downloader"
            aria-label={`Enviar pasta ${label} para o Downloader`}
            className={folderActionSendClass}
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
        <div className="min-h-0 overflow-hidden bg-[#101010]">
          <div className="p-0">
            {error && (
              <p className="m-3 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">{error}</p>
            )}
            {loading && !loaded && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            )}

            {loaded && contentMode === "folders" && (
              <div>
                {childFolders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500">Nenhuma subpasta nesta pasta.</p>
                ) : (
                  <>
                    <div className={`${poolTableHeadClass} grid-cols-[minmax(0,1fr)_auto]`}>
                      <span>Pasta</span>
                      <span className="text-right">Abrir</span>
                    </div>
                    {childFolders.map((child, index) => {
                      const childSegments = [...packSlugSegments, slugifyFolderName(child.name)];
                      return (
                        <Link
                          key={child.id}
                          href={folderHref(childSegments)}
                          className={`${poolRowBaseClass} grid-cols-[minmax(0,1fr)_auto] ${poolRowTone(index)}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-[#1ed760]/80" />
                            <span className="truncate text-sm font-semibold text-zinc-100">
                              {displayFolderName(child.name)}
                            </span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
                        </Link>
                      );
                    })}
                  </>
                )}
                {tracks.length > 0 && (
                  <div className="border-t border-zinc-700/70">
                    <div className={poolPanelHeaderClass}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                        Faixas nesta pasta
                      </p>
                    </div>
                    <VipMusicTrackList
                      folderId={folder.id}
                      tracks={tracks}
                      canPlay={canPlay}
                      canDownload={canDownload}
                      relativePath={relativePath}
                      layout="table"
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
                  </div>
                )}
              </div>
            )}

            {loaded && contentMode === "tracks" && tracks.length === 0 && !loading && (
              <p className="py-6 text-center text-sm text-zinc-500">Nenhuma faixa nesta pasta.</p>
            )}
            {loaded && contentMode === "tracks" && tracks.length > 0 && (
              <VipMusicTrackList
                folderId={folder.id}
                tracks={tracks}
                canPlay={canPlay}
                canDownload={canDownload}
                relativePath={relativePath}
                highlightTrackId={highlightTrackId}
                autoPlayTrackId={autoPlayTrackId}
                layout="table"
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
            {contentMode === "tracks" && hasMore && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadTrackPage(page + 1, true)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-zinc-700/70 bg-[#141414] py-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-500 transition-colors hover:bg-[#1c1c1c] hover:text-zinc-300 disabled:opacity-50"
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
