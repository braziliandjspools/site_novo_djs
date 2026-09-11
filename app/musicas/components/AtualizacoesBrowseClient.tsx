"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { ensureAudioExtension } from "../../lib/google-drive";
import { formatBytes } from "../../lib/format-bytes";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  childrenAreWeekFolders,
  displayFolderName,
  folderHref,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import { matchStyleSlug } from "../atualizacoes/AtualizacoesSearch";
import {
  clearMusicasCache,
  fetchMusicasJson,
  peekMusicasCache,
  setMusicasCache,
} from "../lib/musicas-fetch-cache";
import { sendPackSlugToDownloader } from "../lib/send-to-downloader";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { PackHero, PackHeroSkeleton, type PackHeroStat } from "./PackHero";
import { StyleFolderLinks } from "./StyleFolderLinks";
import { WeekFolderGrid } from "./WeekFolderGrid";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useDownloaderSync } from "./DownloaderSyncContext";
import { useMusicasSession } from "./MusicasSessionContext";
import { useMusicasToast } from "./MusicasToast";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { pushRecentFolder } from "../lib/music-library-storage";
import { stylesReadKey, weeksReadKey } from "../lib/read-state";
import { useNewFolderHighlights } from "../lib/use-new-folder-highlights";
import { poolPanelHeaderClass } from "./atualizacoes-pool-ui";
import { MusicasListSkeleton, MusicasPageSkeleton, MusicasTracksSkeleton } from "./MusicasSkeletons";

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
  resolvedPath: { slug: string; id: string; name: string }[];
  slugSegments: string[];
  /** Irmãos da pasta atual (mesmo nível) — vem do resolve. */
  siblings?: VipMusicFolder[];
};

type AtualizacoesBrowseClientProps = {
  slugSegments: string[];
};

function resolveUrl(slugPath: string, forceRefresh = false) {
  const refresh = forceRefresh ? "&refresh=1" : "";
  return `/api/musicas/resolve?slug=${encodeURIComponent(slugPath)}${refresh}`;
}

async function triggerTrackDownload(track: PreviewTrack) {
  const filename = ensureAudioExtension(track.fileName ?? track.title);
  const name = encodeURIComponent(filename);
  const response = await fetch(`/api/musicas/download/${track.id}?name=${name}`);
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
  const faixaId = searchParams.get("faixa");
  const slugPath = slugSegments.join("/");
  const monthSlug = slugSegments[0] ?? "";
  const weekSlug = slugSegments[1];

  const initialCache = peekMusicasCache<ResolveResponse>(resolveUrl(slugPath));
  const [data, setData] = useState<ResolveResponse | null>(initialCache);
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<VipMusicFolder[]>([]);
  const [siblingWeeks, setSiblingWeeks] = useState<VipMusicFolder[]>([]);
  const [siblingFolders, setSiblingFolders] = useState<VipMusicFolder[]>([]);
  const [playBusy, setPlayBusy] = useState(false);
  const [sendingPack, setSendingPack] = useState(false);
  const [downloadingPack, setDownloadingPack] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    void fetchMusicasJson<{ folders?: VipMusicFolder[] }>("/api/musicas/tree")
      .then((body) => setMonths(body.folders ?? []))
      .catch(() => setMonths([]));
  }, []);

  useEffect(() => {
    if (!monthSlug || !weekSlug) {
      setSiblingWeeks([]);
      return;
    }
    // Resolve da semana já traz os irmãos (outras semanas do mês).
    if (data?.siblings?.length && data.slugSegments?.[0] === monthSlug) {
      if (childrenAreWeekFolders(data.siblings)) {
        setSiblingWeeks(data.siblings);
        return;
      }
    }
    let cancelled = false;
    void fetchMusicasJson<ResolveResponse>(resolveUrl(monthSlug))
      .then((body) => {
        if (cancelled) return;
        if (body.level === "folders" && childrenAreWeekFolders(body.items)) {
          setSiblingWeeks(body.items);
        } else if (body.siblings && childrenAreWeekFolders(body.siblings)) {
          setSiblingWeeks(body.siblings);
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
  }, [monthSlug, weekSlug, data]);

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
      const canonicalUrl = resolveUrl(slugPath);
      const url = resolveUrl(slugPath, options?.forceRefresh);
      const cached = options?.forceRefresh ? null : peekMusicasCache<ResolveResponse>(canonicalUrl);
      if (cached) {
        startTransition(() => setData(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        if (options?.forceRefresh) clearMusicasCache("/api/musicas/");
        const body = await fetchMusicasJson<ResolveResponse>(url, {
          forceRefresh: options?.forceRefresh,
        });
        setMusicasCache(canonicalUrl, body);
        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pasta não encontrada.");
        if (!cached) setData(null);
      } finally {
        setLoading(false);
      }
    },
    [slugPath],
  );

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  // Ao trocar de pasta (ou sair da página), para o player.
  useEffect(() => {
    stop();
    return () => {
      stop();
    };
  }, [slugPath, stop]);

  const showingWeeks = useMemo(() => {
    if (!data || data.level !== "folders" || slugSegments.length !== 1) return false;
    return childrenAreWeekFolders(data.items);
  }, [data, slugSegments.length]);

  const showingStyles = Boolean(data && data.level === "folders" && !showingWeeks);
  const showingTracks = Boolean(data && data.level === "tracks");
  const directTracks = data?.tracks ?? [];

  // Links antigos ?estilo= passam a abrir a pasta na URL.
  useEffect(() => {
    if (!data || !estiloSlug || !showingStyles) return;
    const match = data.items.find((item) => matchStyleSlug(item.name, estiloSlug));
    if (!match) return;
    const nextSegments = [...slugSegments, slugifyFolderName(match.name)];
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

  const playbackEnabled = Boolean(data?.canPlay);
  const downloadEnabled = Boolean(data?.canDownload ?? data?.canPlayFull);

  const monthTitle = data?.resolvedPath[0]
    ? displayFolderName(data.resolvedPath[0].name)
    : monthSlug.replace(/-/g, " ");
  const weekTitle = data?.resolvedPath[1]
    ? displayFolderName(data.resolvedPath[1].name)
    : weekSlug?.replace(/-/g, " ");
  const currentTitle = data ? displayFolderName(data.folderName) : monthTitle;

  const childIds = data?.items.map((item) => item.id) ?? [];
  const highlightKey = showingWeeks
    ? weeksReadKey(monthSlug)
    : stylesReadKey(weekSlug ? `${monthSlug}/${weekSlug}` : monthSlug);
  const newChildIds = useNewFolderHighlights(highlightKey, childIds);

  const relativeStyleBase = weekTitle ? `${monthTitle}/${weekTitle}` : monthTitle;
  const tracksRelativePath = data
    ? `${relativeStyleBase}/${displayFolderName(data.folderName)}`
    : relativeStyleBase;
  const showInitialSkeleton = loading && !data;

  const heroMode = showingTracks
    ? "tracks"
    : showingWeeks
      ? "weeks"
      : weekSlug
        ? "week-styles"
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
    const first = directTracks[0];
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
    setDownloadingPack(true);
    let ok = 0;
    let failed = 0;
    try {
      showToast(
        directTracks.length === 1
          ? "Baixando 1 faixa…"
          : `Baixando ${directTracks.length} faixas no navegador…`,
      );
      for (const track of directTracks) {
        try {
          await triggerTrackDownload(track);
          ok += 1;
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
  }, [
    authenticated,
    directTracks,
    downloadEnabled,
    downloadingPack,
    openLogin,
    showToast,
  ]);

  const parentSegments = slugSegments.slice(0, -1);
  const parentPathKey = parentSegments.join("/");
  const homeParentHref = parentPathKey
    ? folderHref(parentPathKey.split("/"))
    : "/musicas/atualizacoes";
  const currentFolderSlug = slugSegments.at(-1) ?? "";
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
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/atualizacoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Atualizações
        </Link>
        {(data?.resolvedPath ?? []).map((part, index, all) => {
          const hrefParts = all.slice(0, index + 1).map((item) => item.slug);
          const isLast = index === all.length - 1;
          return (
            <span key={`${part.id}-${part.slug}`} className="contents">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="font-medium text-white">{displayFolderName(part.name)}</span>
              ) : (
                <Link
                  href={folderHref(hrefParts)}
                  className="font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  {displayFolderName(part.name)}
                </Link>
              )}
            </span>
          );
        })}
        {!data && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-white">{currentTitle}</span>
          </>
        )}
      </nav>

      {showInitialSkeleton && (slugSegments.length >= 2 ? <PackHeroSkeleton /> : <MusicasPageSkeleton />)}

      {data && showingTracks ? (
        <PackHero
          title={displayFolderName(data.folderName)}
          eyebrow="Pack"
          description="Ouça no navegador, baixe no dispositivo ou envie direto ao BRS Downloader."
          coverUrl={data.coverUrl}
          backgroundImage={data.coverUrl}
          stats={packStats}
          playing={packPlaying}
          playBusy={playBusy}
          canPlay={playbackEnabled && directTracks.length > 0}
          canDownload={downloadEnabled}
          downloading={downloadingPack}
          sendingToDownloader={sendingPack}
          onPlay={() => void handlePackPlay()}
          onSendToDownloader={() => void handlePackSendToDownloader()}
          onDownload={() => void handlePackDownload()}
          onSynced={async () => {
            await loadBrowse({ forceRefresh: true });
          }}
        />
      ) : null}

      {data && !showingTracks ? (
        <AtualizacoesMonthHero
          folderName={data.folderName}
          itemCount={heroCount}
          hasVip={hasVip}
          mode={heroMode}
          coverUrl={data.coverUrl}
          actions={
            <AtualizacoesDriveSyncButton
              onSynced={async () => {
                await loadBrowse({ forceRefresh: true });
              }}
            />
          }
          coverAction={
            slugSegments.length === 1 ? (
              <SendPackToDownloaderButton
                slug={monthSlug}
                onCover
                label="Enviar mês inteiro ao Downloader"
              />
            ) : weekSlug && slugSegments.length === 2 ? (
              <SendPackToDownloaderButton
                slug={`${monthSlug}/${weekSlug}`}
                onCover
                label="Enviar semana ao Downloader"
              />
            ) : slugSegments.length >= 3 ? (
              <SendPackToDownloaderButton
                slug={slugPath}
                onCover
                label="Enviar pasta ao Downloader"
              />
            ) : null
          }
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
        <>
          <WeekFolderGrid
            monthSlug={monthSlug}
            monthName={monthTitle}
            weeks={data.items}
            newWeekIds={newChildIds}
          />
          <AtualizacoesMonthFooterNav
            monthSlug={monthSlug}
            months={months}
            weeks={showingWeeks ? data.items : siblingWeeks}
            weekSlug={weekSlug}
            homeHref="/musicas/atualizacoes"
            homeLabel="Home"
          />
        </>
      )}

      {!error && data && showingStyles && (
        <>
          <StyleFolderLinks
            folders={data.items}
            slugSegments={slugSegments}
            newFolderIds={newChildIds}
          />
          {directTracks.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-md border border-zinc-700/70 bg-black">
              <div className={poolPanelHeaderClass}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Arquivos nesta pasta · {directTracks.length}
                </p>
              </div>
              <VipMusicTrackList
                folderId={data.folderId}
                tracks={directTracks}
                canPlay={playbackEnabled}
                canDownload={downloadEnabled}
                relativePath={relativeStyleBase}
                layout="table"
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
              weekSlug={weekSlug}
              homeHref={weekSlug ? folderHref([monthSlug]) : "/musicas/atualizacoes"}
              homeLabel="Home"
            />
          )}
        </>
      )}

      {!error && data && showingTracks && (
        <div className="overflow-hidden">
          {directTracks.length === 0 && loading ? (
            <MusicasTracksSkeleton />
          ) : directTracks.length === 0 ? (
            <p className="rounded-md border border-zinc-700 bg-black px-4 py-8 text-center text-sm text-zinc-500">
              Nenhuma faixa nesta pasta.
            </p>
          ) : (
            <VipMusicTrackList
              folderId={data.folderId}
              tracks={directTracks}
              canPlay={playbackEnabled}
              canDownload={downloadEnabled}
              relativePath={tracksRelativePath}
              coverUrl={data.coverUrl}
              albumTitle={displayFolderName(data.folderName)}
              highlightTrackId={faixaId ?? undefined}
              autoPlayTrackId={playbackEnabled && faixaId ? faixaId : undefined}
              layout="table"
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
      )}

      {!error && !data && !loading && <MusicasListSkeleton rows={6} />}
    </div>
  );
}
