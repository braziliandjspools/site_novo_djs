"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  ChevronDown,
  FolderOpen,
  Loader2,
  MonitorDown,
  Music2,
  Search,
  X,
} from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { fetchMusicasJson, peekMusicasCache, setMusicasCache } from "../lib/musicas-fetch-cache";
import { canSendFolderToDownloader } from "../lib/can-send-to-downloader";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { isDownloaderSendCancelled } from "./DownloaderBulkConfirm";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";

/** Faixas visíveis por página dentro do acordeão (restante via "Carregar mais"). */
const ACCORDION_TRACKS_PAGE_SIZE = 35;

type ResolveResponse = {
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  tracks?: PreviewTrack[];
  coverUrl?: string | null;
  canPlay: boolean;
  canDownload?: boolean;
  canPlayFull?: boolean;
};

function resolveUrl(slugPath: string) {
  return `/api/musicas/resolve?slug=${encodeURIComponent(slugPath)}`;
}

function FolderDownloadButton({
  slug,
  label,
  trackCountHint,
}: {
  slug: string;
  label: string;
  trackCountHint?: number | null;
}) {
  const { authenticated, hasVip, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const [sending, setSending] = useState(false);

  async function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (sending) return;
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
      const result = await sendPackSlugToDownloader(slug, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "vip",
        previewCount: Math.max(1, trackCountHint ?? 1),
        confirmLabel: label,
      });
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader`,
      );
      await sync?.refresh();
    } catch (err) {
      if (isDownloaderSendCancelled(err)) return;
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={sending}
      className="inline-flex h-8 min-w-[32px] flex-shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#1ed760]/35 bg-[#1ed760]/12 px-2.5 text-[11px] font-bold uppercase tracking-wide text-[#1ed760] transition hover:bg-[#1ed760]/20 disabled:opacity-50"
      aria-label={`Baixar pasta ${label}`}
    >
      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
      <span className="hidden min-[420px]:inline">{sending ? "Enviando…" : "Baixar"}</span>
    </button>
  );
}

/** Pagina a lista completa de faixas já carregada (35 por vez, sem nova chamada de rede). */
function useAccordionTrackPage(tracks: PreviewTrack[] | undefined) {
  const all = tracks ?? [];
  const [visibleCount, setVisibleCount] = useState(ACCORDION_TRACKS_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(ACCORDION_TRACKS_PAGE_SIZE);
  }, [all]);

  const visible = all.slice(0, visibleCount);
  const hasMore = all.length > visibleCount;

  const loadMore = useCallback(async () => {
    const next = Math.min(all.length, visibleCount + ACCORDION_TRACKS_PAGE_SIZE);
    setVisibleCount(next);
    return { tracks: all.slice(0, next), hasMore: all.length > next };
  }, [all, visibleCount]);

  return { visible, hasMore, loadMore };
}

function AccordionLoadMoreButton({
  hasMore,
  onLoadMore,
  shownCount,
  totalCount,
}: {
  hasMore: boolean;
  onLoadMore: () => Promise<unknown>;
  shownCount: number;
  totalCount: number;
}) {
  const [loading, setLoading] = useState(false);
  if (!hasMore) return null;

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      await onLoadMore();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5 py-3">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleClick()}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-[#1ed760]/50 hover:bg-[#1ed760]/10 hover:text-[#1ed760] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Carregar mais
      </button>
      <p className="text-[10px] text-white/35">
        Mostrando {shownCount} de {totalCount} faixas
      </p>
    </div>
  );
}

function NestedFolderAccordion({
  folder,
  parentSegments,
  canPlay,
  canDownload,
  packTitle,
}: {
  folder: VipMusicCatalogItem;
  parentSegments: string[];
  canPlay: boolean;
  canDownload: boolean;
  packTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResolveResponse | null>(null);

  const folderSlug = slugifyFolderName(folder.name);
  const slugPath = [...parentSegments, folderSlug].join("/");
  const title = displayFolderName(folder.name);
  const showDownload = canSendFolderToDownloader(folder, parentSegments);

  const load = useCallback(async () => {
    const url = resolveUrl(slugPath);
    const cached = peekMusicasCache<ResolveResponse>(url);
    if (cached) {
      setData(cached);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await fetchMusicasJson<ResolveResponse>(url);
      setMusicasCache(url, body);
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a pasta.");
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const tracks = data?.tracks ?? [];
  const childFolders = data?.level === "folders" ? data.items : [];
  const { visible: visibleTracks, hasMore: hasMoreTracks, loadMore: loadMoreTracks } =
    useAccordionTrackPage(tracks);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
      <div className="flex items-stretch gap-1.5 p-1.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/70">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-bold uppercase tracking-wide text-white">
              {title}
            </span>
            <span className="mt-0.5 block text-[10.5px] text-white/45">
              {(folder.trackCount ?? 0) > 0
                ? `${folder.trackCount} ${(folder.trackCount ?? 0) === 1 ? "faixa" : "faixas"}`
                : (folder.folderCount ?? 0) > 0
                  ? `${folder.folderCount} ${(folder.folderCount ?? 0) === 1 ? "subpasta" : "subpastas"}`
                  : "Pasta"}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <CopyPackLinkButton
          slugSegments={[...parentSegments, folderSlug]}
          label={`Copiar link de ${title}`}
        />
        {showDownload ? (
          <FolderDownloadButton slug={slugPath} label={title} trackCountHint={folder.trackCount} />
        ) : null}
      </div>

      {open ? (
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain border-t border-white/[0.06] px-2 pb-3 pt-2 sm:px-3">
          {loading && !data ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </div>
          ) : null}
          {error ? <p className="px-2 py-4 text-sm text-red-400">{error}</p> : null}
          {data?.level === "tracks" || tracks.length > 0 ? (
            <>
              <VipMusicTrackList
                folderId={data?.folderId ?? folder.id}
                tracks={visibleTracks}
                canPlay={canPlay && Boolean(data?.canPlay ?? canPlay)}
                canDownload={canDownload && Boolean(data?.canDownload ?? data?.canPlayFull ?? canDownload)}
                relativePath={`${packTitle}/${title}`}
                coverUrl={data?.coverUrl}
                albumTitle={title}
                layout="table"
                groupByDate={false}
                hasMore={hasMoreTracks}
                onLoadMore={loadMoreTracks}
              />
              <AccordionLoadMoreButton
                hasMore={hasMoreTracks}
                onLoadMore={loadMoreTracks}
                shownCount={visibleTracks.length}
                totalCount={tracks.length}
              />
            </>
          ) : null}
          {childFolders.length > 0 ? (
            <div className="space-y-2">
              {childFolders.map((child) => (
                <NestedFolderAccordion
                  key={child.id}
                  folder={child}
                  parentSegments={[...parentSegments, folderSlug]}
                  canPlay={canPlay}
                  canDownload={canDownload}
                  packTitle={`${packTitle}/${title}`}
                />
              ))}
            </div>
          ) : null}
          {data && tracks.length === 0 && childFolders.length === 0 && !loading ? (
            <p className="py-6 text-center text-sm text-white/40">Pasta vazia.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GenreAccordion({
  folder,
  acervoSegments,
  canPlay,
  canDownload,
  packTitle,
  forceOpen,
  searchQuery,
  isNew,
}: {
  folder: VipMusicCatalogItem;
  acervoSegments: string[];
  canPlay: boolean;
  canDownload: boolean;
  packTitle: string;
  forceOpen?: boolean;
  searchQuery?: string;
  isNew?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(forceOpen));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResolveResponse | null>(null);

  const folderSlug = slugifyFolderName(folder.name);
  const slugPath = [...acervoSegments, folderSlug].join("/");
  const title = displayFolderName(folder.name);
  const showDownload = canSendFolderToDownloader(folder, acervoSegments);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const load = useCallback(async () => {
    const url = resolveUrl(slugPath);
    const cached = peekMusicasCache<ResolveResponse>(url);
    if (cached) {
      setData(cached);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await fetchMusicasJson<ResolveResponse>(url);
      setMusicasCache(url, body);
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir o estilo.");
    } finally {
      setLoading(false);
    }
  }, [slugPath]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  const tracks = data?.tracks ?? [];
  const childFolders = useMemo(() => {
    if (!data || data.level !== "folders") return [];
    const q = searchQuery?.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter((item) => displayFolderName(item.name).toLowerCase().includes(q));
  }, [data, searchQuery]);
  const { visible: visibleTracks, hasMore: hasMoreTracks, loadMore: loadMoreTracks } =
    useAccordionTrackPage(tracks);

  const badgeCount =
    typeof folder.trackCount === "number" && folder.trackCount > 0
      ? folder.trackCount
      : typeof folder.folderCount === "number" && folder.folderCount > 0
        ? folder.folderCount
        : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141816] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-1.5 p-1.5 sm:flex-row sm:items-stretch sm:gap-1.5 sm:p-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-h-[34px] min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1ed760]/25 to-white/5 text-[#1ed760] ring-1 ring-[#1ed760]/25">
            <Music2 className="h-3 w-3" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="block truncate font-display text-[12px] font-bold uppercase tracking-tight text-white sm:text-[12.5px]">
                {title}
              </span>
              {isNew ? (
                <span className="flex-shrink-0 rounded-md bg-[#1ed760]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-black">
                  Novo
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-[10px] text-white/45">
              {badgeCount != null
                ? `${badgeCount.toLocaleString("pt-BR")} ${
                    (folder.trackCount ?? 0) > 0
                      ? badgeCount === 1
                        ? "música"
                        : "músicas"
                      : badgeCount === 1
                        ? "pasta"
                        : "pastas"
                  }`
                : "Abrir para ver conteúdo"}
            </span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 flex-shrink-0 text-white/55 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <div className="flex items-center justify-end gap-1.5 px-1 pb-0.5 sm:items-center sm:pb-0">
          <CopyPackLinkButton
            slugSegments={[...acervoSegments, folderSlug]}
            label={`Copiar link de ${title}`}
          />
          {showDownload ? (
            <FolderDownloadButton slug={slugPath} label={title} trackCountHint={folder.trackCount} />
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="max-h-[70vh] overflow-y-auto overscroll-contain border-t border-white/[0.06] px-2.5 pb-3 pt-3 sm:px-3.5">
          {loading && !data ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando pastas…
            </div>
          ) : null}
          {error ? <p className="px-2 py-4 text-sm text-red-400">{error}</p> : null}

          {data?.level === "tracks" || (tracks.length > 0 && childFolders.length === 0) ? (
            <>
              <VipMusicTrackList
                folderId={data?.folderId ?? folder.id}
                tracks={visibleTracks}
                canPlay={canPlay && Boolean(data?.canPlay ?? canPlay)}
                canDownload={canDownload && Boolean(data?.canDownload ?? data?.canPlayFull ?? canDownload)}
                relativePath={`${packTitle}/${title}`}
                coverUrl={data?.coverUrl}
                albumTitle={title}
                layout="table"
                groupByDate={false}
                hasMore={hasMoreTracks}
                onLoadMore={loadMoreTracks}
              />
              <AccordionLoadMoreButton
                hasMore={hasMoreTracks}
                onLoadMore={loadMoreTracks}
                shownCount={visibleTracks.length}
                totalCount={tracks.length}
              />
            </>
          ) : null}

          {childFolders.length > 0 ? (
            <div className="space-y-2">
              {childFolders.map((child) => (
                <NestedFolderAccordion
                  key={child.id}
                  folder={child}
                  parentSegments={[...acervoSegments, folderSlug]}
                  canPlay={canPlay}
                  canDownload={canDownload}
                  packTitle={`${packTitle}/${title}`}
                />
              ))}
            </div>
          ) : null}

          {data && tracks.length === 0 && childFolders.length === 0 && !loading ? (
            <p className="py-8 text-center text-sm text-white/40">Nenhum conteúdo neste estilo.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

type AtualizacoesAcervoAccordionProps = {
  folders: VipMusicCatalogItem[];
  acervoSegments: string[];
  packTitle: string;
  canPlay: boolean;
  canDownload: boolean;
  newFolderIds?: Set<string>;
};

/** Acervo em acordeão recursivo (lazy-load ao abrir cada pasta). */
export function AtualizacoesAcervoAccordion({
  folders,
  acervoSegments,
  packTitle,
  canPlay,
  canDownload,
  newFolderIds,
}: AtualizacoesAcervoAccordionProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((folder) => {
      const name = displayFolderName(folder.name).toLowerCase();
      return name.includes(q);
    });
  }, [folders, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar música, artista ou estilo neste acervo…"
          className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 py-3 pl-11 pr-11 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-[#1ed760]/40 focus:ring-2 focus:ring-[#1ed760]/15"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-white/45">
          Nenhum estilo encontrado para &quot;{query}&quot;.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((folder) => (
            <GenreAccordion
              key={folder.id}
              folder={folder}
              acervoSegments={acervoSegments}
              canPlay={canPlay}
              canDownload={canDownload}
              packTitle={packTitle}
              forceOpen={Boolean(query.trim()) && filtered.length <= 8}
              searchQuery={query}
              isNew={newFolderIds?.has(folder.id)}
            />
          ))}
        </div>
      )}

      {newFolderIds && newFolderIds.size > 0 ? (
        <p className="text-[11px] text-white/30">
          Estilos com conteúdo novo ficam marcados com “Novo” até meia-noite.
        </p>
      ) : null}
    </div>
  );
}
