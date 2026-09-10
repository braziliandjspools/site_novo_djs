"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
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
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { AtualizacoesMonthFooterNav } from "./AtualizacoesMonthFooterNav";
import { AtualizacoesMonthHero } from "./AtualizacoesMonthHero";
import { StyleFolderLinks } from "./StyleFolderLinks";
import { WeekFolderGrid } from "./WeekFolderGrid";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
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
};

type AtualizacoesBrowseClientProps = {
  slugSegments: string[];
};

function resolveUrl(slugPath: string, forceRefresh = false) {
  const refresh = forceRefresh ? "&refresh=1" : "";
  return `/api/musicas/resolve?slug=${encodeURIComponent(slugPath)}${refresh}`;
}

export function AtualizacoesBrowseClient({ slugSegments }: AtualizacoesBrowseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    let cancelled = false;
    void fetchMusicasJson<ResolveResponse>(resolveUrl(monthSlug))
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
  }, [monthSlug, weekSlug]);

  /** Irmãos da pasta atual (para prev/next no rodapé ao abrir faixas ou subpastas). */
  useEffect(() => {
    if (slugSegments.length < 2) {
      setSiblingFolders([]);
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
  }, [slugPath, slugSegments]);

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

  const { hasVip } = useMusicasSession();
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

      {showInitialSkeleton && <MusicasPageSkeleton />}

      {data && (
        <AtualizacoesMonthHero
          folderName={data.folderName}
          itemCount={heroCount}
          hasVip={hasVip}
          mode={heroMode}
          coverUrl={data.coverUrl}
          badgeActions={
            <AtualizacoesDriveSyncButton
              onSynced={async () => {
                await loadBrowse({ forceRefresh: true });
              }}
            />
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {slugSegments.length === 1 ? (
                <SendPackToDownloaderButton
                  slug={monthSlug}
                  label="Enviar mês inteiro ao Downloader"
                />
              ) : weekSlug && slugSegments.length === 2 ? (
                <SendPackToDownloaderButton
                  slug={`${monthSlug}/${weekSlug}`}
                  label="Enviar semana ao Downloader"
                />
              ) : slugSegments.length >= 3 || showingTracks ? (
                <SendPackToDownloaderButton
                  slug={slugPath}
                  label="Enviar pasta ao Downloader"
                />
              ) : null}
            </div>
          }
        />
      )}

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
                  Faixas nesta pasta · {directTracks.length}
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
