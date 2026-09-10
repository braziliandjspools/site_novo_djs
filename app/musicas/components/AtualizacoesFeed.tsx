"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VipMusicFeedResponse, VipMusicFolder } from "../../lib/vip-music-catalog";
import { folderHref, slugifyFolderName, displayFolderName } from "../../lib/vip-music-slugs";
import { fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { AtualizacoesPackBlock } from "./AtualizacoesPackBlock";
import { AtualizacoesDriveSyncButton } from "./AtualizacoesDriveSyncButton";
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { poolPanelClass, poolPanelHeaderClass } from "./atualizacoes-pool-ui";

type TreeResponse = { folders?: VipMusicFolder[]; error?: string };
type FeedResponse = VipMusicFeedResponse & { canPlay?: boolean; canDownload?: boolean; error?: string };

function feedUrl(page: number, forceRefresh = false) {
  const refresh = forceRefresh ? "&refresh=1" : "";
  return `/api/musicas/feed?page=${page}${refresh}`;
}

function pageItems(current: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const items = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  return [...items].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
}

type AtualizacoesFeedProps = {
  canPlay: boolean;
};

export function AtualizacoesFeed({ canPlay }: AtualizacoesFeedProps) {
  const cachedFeed = peekMusicasCache<FeedResponse>(feedUrl(1));
  const cachedTree = peekMusicasCache<TreeResponse>("/api/musicas/tree");
  const [page, setPage] = useState(1);
  const [feed, setFeed] = useState<FeedResponse | null>(cachedFeed);
  const [months, setMonths] = useState<VipMusicFolder[]>(cachedTree?.folders ?? []);
  const [loading, setLoading] = useState(!cachedFeed?.packs?.length);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async (nextPage: number, forceRefresh = false) => {
    if (forceRefresh || !peekMusicasCache(feedUrl(nextPage))) setLoading(true);
    setError(null);
    try {
      const data = await fetchMusicasJson<FeedResponse>(feedUrl(nextPage, forceRefresh), { forceRefresh });
      setFeed(data);
      if (data.error) setError(data.error);
    } catch {
      setError("Não foi possível carregar as atualizações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed(page);
  }, [loadFeed, page]);

  useEffect(() => {
    void fetchMusicasJson<TreeResponse>("/api/musicas/tree")
      .then((data) => setMonths(data.folders ?? []))
      .catch(() => setMonths([]));
  }, []);

  const totalPages = useMemo(() => {
    const total = feed?.total ?? 0;
    const size = feed?.pageSize ?? 6;
    return Math.max(1, Math.ceil(total / size));
  }, [feed]);

  const pages = pageItems(page, totalPages);
  const playbackEnabled = Boolean(feed?.canPlay ?? canPlay);
  const downloadEnabled = Boolean(feed?.canDownload ?? canPlay);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16.5rem]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">Atualizações</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Packs recentes</h1>
          </div>
          <AtualizacoesDriveSyncButton
            onSynced={() => {
              void loadFeed(page, true);
            }}
          />
        </div>

        {totalPages > 1 ? (
          <nav className="mb-5 flex flex-wrap items-center gap-1.5" aria-label="Paginação">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-white/10 px-3 text-xs font-semibold text-zinc-300 hover:border-white/30 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            {pages.map((item, index) => {
              const prev = pages[index - 1];
              return (
                <span key={item} className="contents">
                  {prev != null && item - prev > 1 ? <span className="px-1 text-zinc-600">…</span> : null}
                  <button
                    type="button"
                    onClick={() => {
                setPage(item);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
                    className={`h-8 min-w-8 rounded-full px-2.5 text-xs font-bold tabular-nums ${
                      item === page ? "bg-[#1ed760] text-black" : "border border-white/10 text-zinc-300 hover:border-white/30"
                    }`}
                  >
                    {item}
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => Math.min(totalPages, current + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-white/10 px-3 text-xs font-semibold text-zinc-300 hover:border-white/30 disabled:opacity-40"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </nav>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        ) : null}

        {loading && !feed?.packs?.length ? (
          <MusicasListSkeleton rows={8} />
        ) : feed?.packs?.length ? (
          <div className="space-y-6">
            {feed.packs.map((pack) => (
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
        ) : (
          <p className={`${poolPanelClass} px-4 py-10 text-center text-sm text-zinc-500`}>
            Nenhum pack encontrado nas atualizações.
          </p>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className={poolPanelClass}>
          <div className={poolPanelHeaderClass}>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">Meses</h2>
            <p className="text-[11px] text-zinc-500">{months.length}</p>
          </div>
          <ul className="max-h-[70vh] divide-y divide-white/[0.06] overflow-y-auto">
            {months.map((folder) => {
              const slug = slugifyFolderName(folder.name);
              return (
                <li key={folder.id}>
                  <Link
                    href={folderHref([slug])}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.04] hover:text-[#1ed760]"
                  >
                    <span className="min-w-0 truncate">{displayFolderName(folder.name)}</span>
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
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
