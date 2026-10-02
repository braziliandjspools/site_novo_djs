"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ChevronRight, Download, Home, Loader2, MonitorDown, Pause, Play } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { formatBytes } from "../../lib/format-bytes";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  isMonthFolderName,
  slugifyFolderName,
  slugifyStyleName,
} from "../../lib/vip-music-slugs";
import { matchStyleSlug } from "../atualizacoes/AtualizacoesSearch";
import {
  clearMusicasCache,
  fetchMusicasJson,
  peekMusicasCache,
  setMusicasCache,
} from "../lib/musicas-fetch-cache";
import { startBrowserTrackDownload } from "../lib/browser-download-file";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { isDownloaderSendCancelled } from "./DownloaderBulkConfirm";
import { autoSyncDriveOnEnter } from "../lib/auto-drive-sync";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { PackHero, type PackHeroStat } from "./PackHero";
import { StyleFolderLinks } from "./StyleFolderLinks";
import { BrowserPackDownloadConfirm } from "./BrowserPackDownloadConfirm";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { MusicLibraryBrowseShell } from "./MusicLibraryBrowseShell";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { pushRecentFolder } from "../lib/music-library-storage";
import { stylesReadKey, weeksReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import {
  flattenTrackSections,
  groupTracksByUploadDate,
} from "../lib/track-date-groups";
import { MusicasCenterLoading } from "./MusicasSkeletons";

type ResolveResponse = {
  folderId: string;
  folderName: string;
  level: "folders" | "tracks";
  items: VipMusicCatalogItem[];
  tracks?: PreviewTrack[];
  tracksHasMore?: boolean;
  updateDays?: { slug: string; label: string }[];
  filterPools?: { slug: string; name: string }[];
  filterStyles?: { slug: string; name: string }[];
  coverUrl?: string | null;
  canPlay: boolean;
  canDownload?: boolean;
  canPlayFull?: boolean;
  resolvedPath: { slug: string; id: string; name: string }[];
  slugSegments: string[];
  /** Irmãos da pasta atual (mesmo nível) — vem do resolve. */
  siblings?: VipMusicFolder[];
};

type AtualizacoesBrowseClientProps = {
  slugSegments: string[];
};

function resolveUrl(
  slugPath: string,
  forceRefresh = false,
  trackOffset?: number,
  trackLimit = 50,
  day?: string,
) {
  const params = new URLSearchParams({ slug: slugPath });
  if (forceRefresh) params.set("refresh", "1");
  if (trackOffset != null && trackOffset > 0) {
    params.set("trackOffset", String(trackOffset));
    params.set("trackLimit", String(trackLimit));
  }
  if (day) params.set("dia", day);
  return `/api/musicas/resolve?${params.toString()}`;
}

async function triggerTrackDownload(track: PreviewTrack) {
  startBrowserTrackDownload(track);
}

function formatUpdatedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Atualizado hoje";
  if (diffDays === 1) return "Atualizado ontem";
  if (diffDays < 7) return `Atualizado há ${diffDays} dias`;
  return `Atualizado em ${date.toLocaleDateString("pt-BR")}`;
}

export function AtualizacoesBrowseClient({ slugSegments }: AtualizacoesBrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stop, toggleTrack, pause, playingFolderId, playingId, isPlaying } = useVipMusicPlayer();
  const { authenticated, hasVip, openLogin } = useMusicasSession();
  const sync = useDownloaderSync();
  const { showToast } = useMusicasToast();
  const estiloSlug = searchParams.get("estilo");
  const dayFilter = searchParams.get("dia") ?? "";
  const faixaId = searchParams.get("faixa");
  const slugPath = slugSegments.join("/");
  const packSlug = slugSegments[0] ?? "";
  /** Compat: 1º segmento (pack ou mês legado). */
  const monthSlug = slugSegments[0] ?? "";
  const weekSlug = slugSegments[1];
  const nestedWeekSlug = slugSegments[2];

  const initialCache = peekMusicasCache<ResolveResponse>(resolveUrl(slugPath));
  const [data, setData] = useState<ResolveResponse | null>(initialCache);
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<VipMusicFolder[]>([]);
  const [packMonths, setPackMonths] = useState<VipMusicFolder[]>([]);
  const [siblingWeeks, setSiblingWeeks] = useState<VipMusicFolder[]>([]);
  const [siblingFolders, setSiblingFolders] = useState<VipMusicFolder[]>([]);
  const [playBusy, setPlayBusy] = useState(false);
  const [sendingPack, setSendingPack] = useState(false);
  const [downloadingPack, setDownloadingPack] = useState(false);
  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);
  const tracksLoadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreTracksRef = useRef(false);
  const hasTracksRef = useRef(false);
  const [browserConfirmOpen, setBrowserConfirmOpen] = useState(false);
  const [bulkLimitNotice, setBulkLimitNotice] = useState<"downloader" | "download" | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    void fetchMusicasJson<{ folders?: VipMusicFolder[] }>("/api/musicas/tree")
      .then((body) => setMonths(body.folders ?? []))
      .catch(() => setMonths([]));
  }, []);

  useEffect(() => {
    if (!packSlug) {
      setPackMonths([]);
      return;
    }
    let cancelled = false;
    void fetchMusicasJson<ResolveResponse>(resolveUrl(packSlug))
      .then((body) => {
        if (cancelled) return;
        if (body.level === "folders") {
          setPackMonths(body.items.filter((item) => isMonthFolderName(item.name)));
        } else {
          setPackMonths([]);
        }
      })
      .catch(() => {
        if (!cancelled) setPackMonths([]);
      });
    return () => {
      cancelled = true;
    };
  }, [packSlug]);

  useEffect(() => {
    const monthPath =
      slugSegments.length >= 2 ? slugSegments.slice(0, 2).join("/") : slugSegments[0] ?? "";
    if (!monthPath) {
      setSiblingWeeks([]);
      return;
    }
    // Já estamos no mês vendo semanas.
    if (data?.level === "folders" && childrenAreWeekFolders(data.items)) {
      setSiblingWeeks(data.items);
      return;
    }
    // Irmãos da semana atual.
    if (data?.siblings?.length && childrenAreWeekFolders(data.siblings)) {
      setSiblingWeeks(data.siblings);
      return;
    }
    let cancelled = false;
    void fetchMusicasJson<ResolveResponse>(resolveUrl(monthPath))
      .then((body) => {
        if (cancelled) return;
        if (body.level === "folders" && childrenAreWeekFolders(body.items)) {
          setSiblingWeeks(body.items);
        } else {
          setSiblingWeeks([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSiblingWeeks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slugSegments, data]);

  /** Irmãos da pasta atual (para prev/next no rodapé ao abrir faixas ou subpastas). */
  useEffect(() => {
    if (slugSegments.length < 2) {
      setSiblingFolders([]);
      return;
    }
    if (data?.siblings?.length) {
      setSiblingFolders(data.siblings);
      return;
    }
    const parentPath = slugSegments.slice(0, -1).join("/");
    let cancelled = false;
    void fetchMusicasJson<ResolveResponse>(resolveUrl(parentPath))
      .then((body) => {
        if (cancelled) return;
        if (body.level === "folders" && body.items.length > 0) {
          setSiblingFolders(body.items);
        } else {
          setSiblingFolders([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSiblingFolders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slugPath, slugSegments, data]);

  const loadBrowse = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      const canonicalUrl = resolveUrl(slugPath, false, undefined, 50, dayFilter);
      const url = resolveUrl(slugPath, options?.forceRefresh, undefined, 50, dayFilter);
      const cached = options?.forceRefresh ? null : peekMusicasCache<ResolveResponse>(canonicalUrl);
      const keepVisible = Boolean(options?.forceRefresh && hasTracksRef.current);
      if (cached) {
        hasTracksRef.current = true;
        startTransition(() => setData(cached));
        setLoading(false);
      } else if (!keepVisible) {
        setLoading(true);
      }
      setError(null);

      try {
        if (options?.forceRefresh) clearMusicasCache("/api/musicas/");
        const body = await fetchMusicasJson<ResolveResponse>(url, {
          forceRefresh: options?.forceRefresh,
        });
        setMusicasCache(canonicalUrl, body);
        hasTracksRef.current = true;
        setData(body);
        return body;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pasta não encontrada.");
        if (!cached) setData(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [slugPath, dayFilter],
  );

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  // Sincroniza automaticamente ao entrar/recarregar a pasta (substitui botão manual).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await autoSyncDriveOnEnter();
      if (cancelled || !result) return;
      await loadBrowse({ forceRefresh: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugPath]);

  // Mantém o player ao navegar pastas (como pools DJ). Só limpa ao sair da árvore.
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const showingWeeks = useMemo(() => {
    if (!data || data.level !== "folders") return false;
    return childrenAreWeekFolders(data.items);
  }, [data]);

  const showingMonths = useMemo(() => {
    if (!data || data.level !== "folders" || showingWeeks) return false;
    return data.items.some((item) => isMonthFolderName(item.name)) &&
      data.items.filter((item) => isMonthFolderName(item.name)).length >=
        Math.max(1, Math.ceil(data.items.length * 0.4));
  }, [data, showingWeeks]);

  const showingStyles = Boolean(data && data.level === "folders" && !showingWeeks);
  const showingTracks = Boolean(data && data.level === "tracks");
  const directTracks = data?.tracks ?? [];
  const tracksHasMore = Boolean(data?.tracksHasMore);

  // Links antigos ?estilo= passam a abrir a pasta na URL.
  useEffect(() => {
    if (!data || !estiloSlug || !showingStyles) return;
    const match = data.items.find((item) => matchStyleSlug(item.name, estiloSlug));
    if (!match) return;
    const nextSegments = [...slugSegments, slugifyStyleName(match.name)];
    const params = new URLSearchParams();
    if (faixaId) params.set("faixa", faixaId);
    const qs = params.toString();
    router.replace(qs ? `${folderHref(nextSegments)}?${qs}` : folderHref(nextSegments));
  }, [data, estiloSlug, faixaId, showingStyles, slugSegments, router]);

  useEffect(() => {
    if (!data) return;
    pushRecentFolder({
      name: displayFolderName(data.folderName),
      href: folderHref(slugSegments),
    });
  }, [data, slugSegments]);

  const poolsFolderId = data?.level === "tracks" && !data.filterPools ? data.folderId : "";
  useEffect(() => {
    if (!poolsFolderId) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await fetchMusicasJson<{ filterPools?: { slug: string; name: string }[] }>(
          `${resolveUrl(slugPath)}&meta=pools`,
        );
        if (cancelled) return;
        setData((current) =>
          current && current.folderId === poolsFolderId
            ? { ...current, filterPools: body.filterPools ?? [] }
            : current,
        );
      } catch {
        if (cancelled) return;
        setData((current) =>
          current && current.folderId === poolsFolderId && !current.filterPools
            ? { ...current, filterPools: [] }
            : current,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [poolsFolderId, slugPath]);

  const playbackEnabled = Boolean(data?.canPlay);
  const downloadEnabled = Boolean(data?.canDownload ?? data?.canPlayFull);
  const loadMoreTracks = useCallback(async () => {
    if (!data || data.level !== "tracks" || loadingMoreTracksRef.current || !tracksHasMore) return;
    loadingMoreTracksRef.current = true;
    setLoadingMoreTracks(true);
    try {
      const url = resolveUrl(slugPath, false, directTracks.length, 50, dayFilter);
      const body = await fetchMusicasJson<ResolveResponse>(url);
      setData((current) => {
        if (!current) return body;
        return {
          ...current,
          tracks: [...(current.tracks ?? []), ...(body.tracks ?? [])],
          tracksHasMore: body.tracksHasMore,
        };
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível carregar mais faixas.", "error");
    } finally {
      loadingMoreTracksRef.current = false;
      setLoadingMoreTracks(false);
    }
  }, [data, dayFilter, directTracks.length, showToast, slugPath, tracksHasMore]);



  // Carregamento infinito: quando o usuário se aproxima do fim da lista,
  // busca automaticamente o próximo lote sem exigir um botão.
  useEffect(() => {
    const sentinel = tracksLoadMoreSentinelRef.current;
    if (!sentinel || !showingTracks || !tracksHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreTracks();
        }
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreTracks, showingTracks, tracksHasMore]);

  const monthTitle = data?.resolvedPath[0]
    ? displayFolderName(data.resolvedPath[0].name)
    : monthSlug.replace(/-/g, " ");
  const calendarMonthName =
    data?.resolvedPath.find((part) => isMonthFolderName(part.name))?.name ??
    (showingWeeks ? data?.folderName : undefined) ??
    monthTitle;
  const weekTitle = nestedWeekSlug
    ? displayFolderName(data?.resolvedPath[2]?.name ?? nestedWeekSlug.replace(/-/g, " "))
    : weekSlug
      ? displayFolderName(data?.resolvedPath[1]?.name ?? weekSlug.replace(/-/g, " "))
      : undefined;
  const currentTitle = data ? displayFolderName(data.folderName) : monthTitle;
  const parentFolderTitle = data?.resolvedPath.at(-2)
    ? displayFolderName(data.resolvedPath.at(-2)?.name ?? "")
    : null;

  const childIds = data?.items.map((item) => item.id) ?? [];
  const highlightKey = showingWeeks
    ? weeksReadKey(slugPath)
    : stylesReadKey(slugPath);
  const seenNewChildIds = useNewFolderHighlights(highlightKey, childIds);
  const newChildIds = useMemo(
    () => new Set([...seenNewChildIds, ...(data?.items.filter((item) => item.isNew).map((item) => item.id) ?? [])]),
    [data?.items, seenNewChildIds],
  );

  const relativeStyleBase = weekTitle ? `${monthTitle}/${weekTitle}` : monthTitle;
  const tracksRelativePath = data
    ? `${relativeStyleBase}/${displayFolderName(data.folderName)}`
    : relativeStyleBase;
  const showInitialSkeleton = loading && !data;

  const heroMode = showingTracks
    ? "tracks"
    : showingWeeks
      ? "weeks"
      : showingMonths
        ? "months"
        : "styles";
  const heroCount = showingTracks ? directTracks.length : (data?.items.length ?? 0);

  const packPlaying = Boolean(
    showingTracks && data && playingFolderId === data.folderId && playingId && isPlaying,
  );

  const packStats = useMemo((): PackHeroStat[] => {
    if (!showingTracks) return [];
    const stats: PackHeroStat[] = [
      {
        label: `${directTracks.length} ${directTracks.length === 1 ? "faixa" : "faixas"}`,
      },
      {
        label: hasVip ? "Premium ativo" : "Só navegação",
        accent: hasVip,
      },
    ];
    const latest = directTracks.reduce<string | null>((best, track) => {
      const stamp = track.modifiedAt;
      if (!stamp) return best;
      if (!best || stamp > best) return stamp;
      return best;
    }, null);
    const updated = formatUpdatedLabel(latest);
    if (updated) stats.push({ label: updated });

    const totalBytes = directTracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0);
    const sizeLabel = formatBytes(totalBytes);
    if (sizeLabel !== "—") stats.push({ label: sizeLabel });

    return stats;
  }, [directTracks, hasVip, showingTracks]);

  const handlePackPlay = useCallback(async () => {
    if (!data || !playbackEnabled || playBusy || directTracks.length === 0) return;
    if (packPlaying) {
      pause();
      return;
    }
    const sections = groupTracksByUploadDate(directTracks);
    const first = flattenTrackSections(sections)[0] ?? directTracks[0];
    if (!first) return;
    setPlayBusy(true);
    try {
      await toggleTrack(data.folderId, first.id);
    } catch {
      showToast("Não foi possível iniciar a reprodução.", "error");
    } finally {
      setPlayBusy(false);
    }
  }, [
    data,
    directTracks,
    packPlaying,
    pause,
    playBusy,
    playbackEnabled,
    showToast,
    toggleTrack,
  ]);

  const handlePackSendToDownloader = useCallback(async () => {
    if (sendingPack) return;
    if (!authenticated) {
      openLogin();
      return;
    }
    if (!hasVip || !downloadEnabled) {
      showToast("Plano VIP necessário para usar o Downloader.", "error");
      return;
    }
    setSendingPack(true);
    try {
      const result = await sendPackSlugToDownloader(slugPath, {
        target: sync?.selectedTarget,
        devices: sync?.devices,
        root: "vip",
      });
      showToast(
        result.count === 1
          ? "1 faixa adicionada ao BRS Downloader"
          : `${result.count} faixas adicionadas ao BRS Downloader (estrutura de pastas preservada)`,
      );
      await sync?.refresh();
    } catch (err) {
      if (isDownloaderSendCancelled(err)) return;
      showToast(err instanceof Error ? err.message : "Não foi possível enviar a pasta.", "error");
    } finally {
      setSendingPack(false);
    }
  }, [
    authenticated,
    downloadEnabled,
    hasVip,
    openLogin,
    sendingPack,
    showToast,
    slugPath,
    sync,
  ]);

  const runBrowserPackDownload = useCallback(async () => {
    if (downloadingPack || directTracks.length === 0) return;
    setDownloadingPack(true);
    let ok = 0;
    let failed = 0;
    try {
      showToast(
        directTracks.length === 1
          ? "Baixando 1 faixa no navegador…"
          : `Baixando ${directTracks.length} faixas no navegador…`,
      );
      for (const track of directTracks) {
        try {
          await triggerTrackDownload(track);
          ok += 1;
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
      setDownloadingPack(false);
    }
  }, [directTracks, downloadingPack, showToast]);

  const handlePackDownload = useCallback(async () => {
    if (downloadingPack || directTracks.length === 0) return;
    if (!authenticated) {
      openLogin();
      return;
    }
    if (!downloadEnabled) {
      showToast("Plano VIP necessário para baixar o pack.", "error");
      return;
    }
    if (directTracks.length > 50 || tracksHasMore) {
      setBulkLimitNotice("download");
      return;
    }
    setBrowserConfirmOpen(true);
  }, [
    authenticated,
    directTracks.length,
    downloadEnabled,
    downloadingPack,
    openLogin,
    showToast,
    tracksHasMore,
  ]);

  const parentSegments = slugSegments.slice(0, -1);
  const parentPathKey = parentSegments.join("/");
  const homeParentHref = parentPathKey
    ? folderHref(parentPathKey.split("/"))
    : "/musicas/atualizacoes";
  const currentFolderSlug = slugSegments.at(-1) ?? "";
  const breadcrumbNavRef = useRef<HTMLElement | null>(null);
  const breadcrumbPath = data?.resolvedPath.map((part) => part.id).join("/") ?? slugSegments.join("/");

  useEffect(() => {
    const nav = breadcrumbNavRef.current;
    if (nav) nav.scrollLeft = nav.scrollWidth;
  }, [breadcrumbPath]);
  const siblingNavItems = useMemo(
    () =>
      siblingFolders.map((folder) => {
        const slug = slugifyFolderName(folder.name);
        const parents = parentPathKey ? parentPathKey.split("/") : [];
        return {
          slug,
          label: displayFolderName(folder.name),
          href: folderHref([...parents, slug]),
        };
      }),
    [siblingFolders, parentPathKey],
  );
  /** Prev/next entre pastas irmãs (ex.: Funk ↔ House) + Home na pasta pai. */
  const useSiblingFolderNav =
    slugSegments.length >= 2 &&
    siblingNavItems.length > 1 &&
    (showingTracks || showingStyles) &&
    !(showingStyles && Boolean(weekSlug) && slugSegments.length === 2);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href={homeParentHref}
          prefetch={false}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[12px] font-bold text-white/70 transition hover:border-[#60cdff]/40 hover:bg-[#60cdff]/10 hover:text-[#60cdff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar
        </Link>
        {data ? (
          <CopyPackLinkButton
            slugSegments={slugSegments}
            label={`Copiar link de ${currentTitle}`}
            className="h-9 w-9 rounded-full"
          />
        ) : null}
      </div>
      <nav
        ref={breadcrumbNavRef}
        aria-label="Caminho das pastas"
        className="mb-5 flex w-full max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#60cdff]/15 bg-[#0d130f] p-2 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href="/musicas/atualizacoes"
          title="Voltar aos acervos"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 font-semibold text-white/70 transition hover:border-[#60cdff]/40 hover:text-[#60cdff]"
        >
          <Home className="h-3.5 w-3.5 text-[#60cdff]" aria-hidden />
          Acervos
        </Link>
        {(data?.resolvedPath ?? []).map((part, index, all) => {
          const hrefParts = all.slice(0, index + 1).map((item) => item.slug);
          const isLast = index === all.length - 1;
          const label = displayFolderName(part.name);
          return (
            <span key={`${part.id}-${part.slug}`} className="inline-flex shrink-0 items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#60cdff]/45" aria-hidden />
              {isLast ? (
                <span
                  aria-current="page"
                  title={label}
                  className="inline-flex h-9 max-w-[min(60vw,18rem)] items-center truncate rounded-xl border border-[#60cdff]/40 bg-[#60cdff]/15 px-3 font-bold text-[#8ad4ff] shadow-[0_0_18px_rgba(96,205,255,0.12)]"
                >
                  <span className="truncate">{label}</span>
                </span>
              ) : (
                <Link
                  href={folderHref(hrefParts)}
                  title={label}
                  className="inline-flex h-9 max-w-[min(42vw,14rem)] items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 font-semibold text-white/65 transition hover:border-[#60cdff]/30 hover:bg-[#60cdff]/10 hover:text-white"
                >
                  <span className="truncate">{label}</span>
                </Link>
              )}
            </span>
          );
        })}
        {!data && (
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-[#60cdff]/45" aria-hidden />
            <span aria-current="page" className="inline-flex h-9 max-w-[min(60vw,18rem)] items-center truncate rounded-xl border border-[#60cdff]/40 bg-[#60cdff]/15 px-3 font-bold text-[#8ad4ff]">
              <span className="truncate">{currentTitle}</span>
            </span>
          </span>
        )}
      </nav>

      {showInitialSkeleton && (
        <MusicasCenterLoading
          label={slugSegments.length >= 2 ? "Carregando a tabela…" : "Carregando acervos…"}
        />
      )}



      {data && !showingTracks && slugSegments.length === 1 ? (
        <AtualizacoesMonthHero
          folderName={data.folderName}
          itemCount={heroCount}
          hasVip={hasVip}
          mode={heroMode}
          coverUrl={data.coverUrl}
        />
      ) : null}

      {!hasVip && data && <VipUpgradeBanner />}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && data && (
        <p className="text-eyebrow mb-3 text-zinc-500">
          Atualizando…
        </p>
      )}

      {!error && data && showingWeeks && (
        <MusicLibraryBrowseShell
          slugSegments={slugSegments}
          resolvedPath={data.resolvedPath}
          rootPacks={months}
          currentChildren={data.items}
          siblings={siblingFolders}
          packMonths={packMonths.length > 0 ? packMonths : data.items}
          monthWeeks={data.items}
          newChildIds={newChildIds}
        >
          <StyleFolderLinks
            folders={data.items}
            slugSegments={slugSegments}
            newFolderIds={newChildIds}
          />
          <AtualizacoesMonthFooterNav
            monthSlug={monthSlug}
            months={months}
            weeks={data.items}
            weekSlug={weekSlug}
            homeHref="/musicas/atualizacoes"
            homeLabel="Home"
          />
        </MusicLibraryBrowseShell>
      )}

      {!error && data && showingStyles && (
        <MusicLibraryBrowseShell
          slugSegments={slugSegments}
          resolvedPath={data.resolvedPath}
          rootPacks={months}
          currentChildren={data.items}
          siblings={siblingFolders}
          packMonths={
            packMonths.length > 0
              ? packMonths
              : showingMonths
                ? data.items
                : packMonths
          }
          monthWeeks={siblingWeeks}
          newChildIds={newChildIds}
        >
          {data.items.length > 0 ? (
            <StyleFolderLinks
              folders={data.items}
              slugSegments={slugSegments}
              newFolderIds={newChildIds}
            />
          ) : null}
          {directTracks.length > 0 && (
            <div className="mt-4 space-y-4">
              <VipMusicTrackList
                folderId={data.folderId}
                groupByDate={false}
                tracks={directTracks}
                canPlay={playbackEnabled}
                canDownload={downloadEnabled}
                relativePath={relativeStyleBase}
                coverUrl={data.coverUrl}
                layout="table"
                filterPools={data.filterPools}
                filterStyles={data.filterStyles}
                updateDays={data.updateDays}
                hasMore={tracksHasMore}
                onLoadMore={loadMoreTracks}
                continueContext={
                  monthSlug
                    ? {
                        monthSlug,
                        monthName: monthTitle,
                        weekSlug: nestedWeekSlug ?? weekSlug,
                        styleName: displayFolderName(data.folderName),
                      }
                    : undefined
                }
              />
            </div>
          )}
          {useSiblingFolderNav ? (
            <AtualizacoesMonthFooterNav
              monthSlug={monthSlug}
              months={months}
              siblings={siblingNavItems}
              currentSiblingSlug={currentFolderSlug}
              homeHref={homeParentHref}
              homeLabel="Home"
            />
          ) : (
            <AtualizacoesMonthFooterNav
              monthSlug={monthSlug}
              months={months}
              weeks={siblingWeeks}
              weekSlug={nestedWeekSlug ?? weekSlug}
              homeHref={
                slugSegments.length > 1
                  ? folderHref(slugSegments.slice(0, -1))
                  : "/musicas/atualizacoes"
              }
              homeLabel="Home"
            />
          )}
        </MusicLibraryBrowseShell>
      )}

      {!error && data && showingTracks && (
        <MusicLibraryBrowseShell
          hideSidebar
          slugSegments={slugSegments}
          resolvedPath={data.resolvedPath}
          rootPacks={months}
          currentChildren={[]}
          siblings={siblingFolders}
          packMonths={packMonths}
          monthWeeks={siblingWeeks}
          updateDays={data.updateDays}
          poolOptions={data.filterPools}
          catalogTracks={directTracks}
          newChildIds={newChildIds}
        >
          <div className="min-w-0 space-y-4">
            {directTracks.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#60cdff]/20 bg-[#161616] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#60cdff]">Faixas da pasta</p>
                  <h1 className="truncate text-base font-bold text-white" title={currentTitle}>{currentTitle}</h1>
                  <p className="text-[11px] text-white/45">{directTracks.length}{tracksHasMore ? "+" : ""} {directTracks.length === 1 ? "faixa" : "faixas"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AtualizacoesDriveSyncButton
                    compact
                    label="Sincronizar"
                    onSynced={async () => {
                      await loadBrowse({ forceRefresh: true });
                    }}
                  />
                  {playbackEnabled ? (
                    <button type="button" onClick={() => void handlePackPlay()} disabled={playBusy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#60cdff] px-3 text-xs font-bold text-black transition hover:bg-[#8ad4ff] disabled:opacity-50">
                      {playBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : packPlaying ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="h-3.5 w-3.5" fill="currentColor" />}
                      {packPlaying ? "Pausar" : "Reproduzir"}
                    </button>
                  ) : null}
                  {downloadEnabled ? (
                    <>
                      <button type="button" onClick={() => void handlePackSendToDownloader()} disabled={sendingPack} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#60cdff]/30 bg-[#60cdff]/10 px-3 text-xs font-semibold text-[#8ad4ff] transition hover:bg-[#60cdff]/20 disabled:opacity-50">
                        {sendingPack ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MonitorDown className="h-3.5 w-3.5" />}
                        Downloader
                      </button>
                      <button type="button" onClick={() => void handlePackDownload()} disabled={directTracks.length > 50 || tracksHasMore || downloadingPack} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
                        {downloadingPack ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Baixar pasta
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
            {directTracks.length > 0 ? (
              <section className="overflow-hidden rounded-2xl border border-[#60cdff]/35 bg-black">
                <div className="h-1 w-full bg-[#60cdff]" />
                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#60cdff]">BRS Downloader</p>
                    <h2 className="mt-1 text-base font-bold text-white">Baixe organizado por pool e por dia</h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-400">
                      Copie o link desta pasta e cole no BRS Downloader. O app pergunta o dia, a pool e os estilos, e grava as músicas nas pastas certas.
                    </p>
                  </div>
                  <CopyPackLinkButton
                    slugSegments={slugSegments}
                    label="Copiar link"
                    showLabel
                    className="!h-11 !w-auto !gap-2 !rounded-full !border-0 !bg-[#60cdff] !px-4 !text-black hover:!bg-[#8ad4ff] hover:!text-black"
                  />
                </div>
              </section>
            ) : null}
            {directTracks.length === 0 && loading ? (
              <MusicasCenterLoading label="Carregando a tabela…" />
            ) : directTracks.length === 0 ? (
              <div className="overflow-hidden rounded-md border border-[#60cdff]/20 bg-[#0d0d0d]">
                <div className="h-px w-full bg-gradient-to-r from-[#60cdff]/80 via-[#60cdff]/25 to-transparent" />
                <p className="rounded-md px-4 py-8 text-center text-sm text-zinc-500">
                  Nenhuma faixa nesta pasta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <VipMusicTrackList
                  folderId={data.folderId}
                  groupByDate={true}
                tracks={directTracks}
                canPlay={playbackEnabled}
                canDownload={downloadEnabled}
                relativePath={tracksRelativePath}
                coverUrl={data.coverUrl}
                albumTitle={displayFolderName(data.folderName)}
                showDriveButton
                highlightTrackId={faixaId ?? undefined}
                autoPlayTrackId={playbackEnabled && faixaId ? faixaId : undefined}
                layout="table"
                filterPools={data.filterPools}
                filterStyles={data.filterStyles}
                updateDays={data.updateDays}
                hasMore={tracksHasMore}
                onLoadMore={loadMoreTracks}
                continueContext={
                  monthSlug
                    ? {
                        monthSlug,
                        monthName: monthTitle,
                        weekSlug,
                        styleName: displayFolderName(data.folderName),
                      }
                    : undefined
                  }
                />
                {tracksHasMore ? (
                  <div
                    ref={tracksLoadMoreSentinelRef}
                    className="h-px w-full"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            )}
            {(useSiblingFolderNav || slugSegments.length >= 2) && (
              <AtualizacoesMonthFooterNav
                monthSlug={monthSlug}
                months={months}
                siblings={siblingNavItems.length > 1 ? siblingNavItems : undefined}
                currentSiblingSlug={currentFolderSlug}
                homeHref={homeParentHref}
                homeLabel="Home"
              />
            )}
          </div>
        </MusicLibraryBrowseShell>
      )}

      {!error && !data && !loading && <MusicasCenterLoading label="Carregando acervos…" />}

      {bulkLimitNotice ? (
        <div className="fixed inset-0 z-[10070] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onClick={() => setBulkLimitNotice(null)}>
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-amber-400/25 bg-[#12151a] p-5 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-amber-400/10 p-2 text-amber-300">
                <Download className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Limite de 50 músicas</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Esta pasta possui mais de 50 músicas. O download da pasta pelo navegador fica disponível somente para pastas com até 50 músicas.
                </p>
                <p className="mt-3 text-xs text-white/40">
                  Use o botão Downloader para enviar o acervo completo.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setBulkLimitNotice(null)} className="mt-5 w-full rounded-full bg-[#60cdff] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-black">
              Entendi
            </button>
          </div>
        </div>
      ) : null}

      <BrowserPackDownloadConfirm
        open={browserConfirmOpen}
        trackCount={directTracks.length}
        onConfirm={() => {
          setBrowserConfirmOpen(false);
          void runBrowserPackDownload();
        }}
        onDismiss={() => {
          setBrowserConfirmOpen(false);
          showToast("Download cancelado — use o Downloader para melhor desempenho.");
        }}
        onPreferDownloader={() => {
          setBrowserConfirmOpen(false);
          showToast("Use o botão Downloader no topo para enviar com mais estabilidade.");
        }}
      />
    </div>
  );
}
