"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import type { VipMusicFeedDay, VipMusicFeedPack, VipMusicFolder } from "../../lib/vip-music-catalog";
import { folderHref, slugifyFolderName, displayFolderName } from "../../lib/vip-music-slugs";
import { fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { AtualizacoesPackBlock } from "./AtualizacoesPackBlock";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { PoolThemeToggle } from "./PoolTheme";
import { poolPanelClass, poolPanelHeaderClass } from "./atualizacoes-pool-ui";

type TreeResponse = { folders?: VipMusicFolder[]; error?: string };
type FeedResponse = {
  days?: VipMusicFeedDay[];
  packs?: VipMusicFeedPack[];
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
  canPlay?: boolean;
  canDownload?: boolean;
  error?: string;
};

function feedUrl(page: number, forceRefresh = false) {
  const refresh = forceRefresh ? "&refresh=1" : "";
  return `/api/musicas/feed?page=${page}${refresh}`;
}

type AtualizacoesFeedProps = {
  canPlay: boolean;
};

function AtualizacoesFeedInner({ canPlay }: AtualizacoesFeedProps) {
  const cachedFeed = peekMusicasCache<FeedResponse>(feedUrl(1));
  const cachedTree = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const [page, setPage] = useState(1);
  const [days, setDays] = useState<VipMusicFeedDay[]>(cachedFeed?.days ?? []);
  const [hasMore, setHasMore] = useState(Boolean(cachedFeed?.hasMore));
  const [months, setMonths] = useState<VipMusicFolder[]>(cachedTree?.folders ?? []);
  const [loading, setLoading] = useState(!cachedFeed?.days?.length && !cachedFeed?.packs?.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackEnabled, setPlaybackEnabled] = useState(Boolean(cachedFeed?.canPlay ?? canPlay));
  const [downloadEnabled, setDownloadEnabled] = useState(Boolean(cachedFeed?.canDownload ?? canPlay));

  const loadFeed = useCallback(
    async (nextPage: number, options?: { forceRefresh?: boolean; append?: boolean }) => {
      const forceRefresh = Boolean(options?.forceRefresh);
      const append = Boolean(options?.append);
      if (!append && (forceRefresh || !peekMusicasCache(feedUrl(nextPage)))) setLoading(true);
      if (append) setLoadingMore(true);
      setError(null);
      try {
        const data = await fetchMusicasJson<FeedResponse>(feedUrl(nextPage, forceRefresh), { forceRefresh });
        if (data.error) setError(data.error);
        const nextDays = data.days ?? [];
        setDays((prev) => {
          if (!append) return nextDays;
          const seen = new Set(prev.map((day) => day.key));
          return [...prev, ...nextDays.filter((day) => !seen.has(day.key))];
        });
        setHasMore(Boolean(data.hasMore));
        setPage(data.page ?? nextPage);
        setPlaybackEnabled(Boolean(data.canPlay ?? canPlay));
        setDownloadEnabled(Boolean(data.canDownload ?? canPlay));
      } catch {
        setError("Não foi possível carregar as atualizações.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [canPlay],
  );

  useEffect(() => {
    void loadFeed(1);
  }, [loadFeed]);

  useEffect(() => {
    void fetchMusicasJson<TreeResponse>("/api/musicas/tree")
      .then((data) => setMonths(data.folders ?? []))
      .catch(() => setMonths([]));
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16.5rem]">
      <div className="min-w-0">
        <header className={`${poolPanelClass} mb-6 overflow-hidden`}>
          <div className="br-stripe-thin" />
          <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#009739]">Atualizações VIP</p>
              <h1 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[color:var(--pool-text)] sm:text-3xl">
                Por data · pools · MP3
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[color:var(--pool-text-muted)]">
                Estrutura do Drive: mês → dia → pools/estilos → faixas (30 por pasta).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PoolThemeToggle />
              <AtualizacoesDriveSyncButton
                onSynced={() => {
                  void loadFeed(1, { forceRefresh: true });
                }}
              />
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
        ) : null}

        {loading && days.length === 0 ? (
          <MusicasListSkeleton rows={8} />
        ) : days.length ? (
          <div className="space-y-8">
            {days.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="pool-date-banner sticky top-[4.5rem] z-10 flex flex-wrap items-center gap-2 px-3 py-2.5 backdrop-blur-md sm:px-4">
                  <CalendarDays className="h-4 w-4 text-[#009739]" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold capitalize tracking-tight text-[color:var(--pool-text)] sm:text-base">
                      {group.label}
                    </h2>
                    <p className="text-[11px] text-[color:var(--pool-text-muted)]">
                      {group.monthName}
                      {group.dayName ? ` · ${group.dayName}` : ""}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-[var(--pool-chip)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--pool-text-muted)]">
                    {group.packs.length} pool{group.packs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-5">
                  {group.packs.map((pack) => (
                    <AtualizacoesPackBlock
                      key={pack.id}
                      pack={pack}
                      canPlay={playbackEnabled}
                      canDownload={downloadEnabled}
                      continueContext={{
                        styleName: pack.name,
                        monthName: pack.monthName,
                        monthSlug: pack.slugSegments[0] ?? "",
                        weekSlug: pack.slugSegments[1],
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void loadFeed(page + 1, { append: true })}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--pool-border)] bg-[var(--pool-surface)] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--pool-text)] shadow-[var(--pool-shadow)] transition-colors hover:border-[#1ed760]/50 hover:text-[#009739] disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Carregar mais dias
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className={`${poolPanelClass} px-4 py-10 text-center text-sm text-[color:var(--pool-text-muted)]`}>
            Nenhum pack encontrado nas atualizações.
          </p>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className={poolPanelClass}>
          <div className={poolPanelHeaderClass}>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--pool-text)]">Meses</h2>
            <p className="text-[11px] text-[color:var(--pool-text-muted)]">{months.length}</p>
          </div>
          <ul className="max-h-[70vh] divide-y divide-[color:var(--pool-border)] overflow-y-auto">
            {months.map((folder) => {
              const slug = slugifyFolderName(folder.name);
              return (
                <li key={folder.id}>
                  <Link
                    href={folderHref([slug])}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-[color:var(--pool-text)] hover:bg-[var(--pool-row-hover)] hover:text-[#009739]"
                  >
                    <span className="min-w-0 truncate">{displayFolderName(folder.name)}</span>
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--pool-text-muted)]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export function AtualizacoesFeed({ canPlay }: AtualizacoesFeedProps) {
  return <AtualizacoesFeedInner canPlay={canPlay} />;
}
