"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, HardDrive, Loader2, Music2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { formatBytes } from "../../lib/format-bytes";
import { VIP_MUSIC_FEED_TRACKS_PAGE_SIZE } from "../../lib/vip-music-catalog";
import { folderHref } from "../../lib/vip-music-slugs";
import { fetchMusicasJson } from "../lib/musicas-fetch-cache";
import { CopyPackLinkButton } from "./CopyPackLinkButton";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { poolPanelClass } from "./atualizacoes-pool-ui";

export type AtualizacoesPackBlockData = {
  id: string;
  name: string;
  slugSegments: string[];
  monthName: string;
  weekName: string | null;
  modifiedAt: string | null;
  tracks: PreviewTrack[];
  trackCount?: number;
  totalSizeBytes?: number;
  tracksHasMore?: boolean;
};

type TracksPageResponse = {
  tracks?: PreviewTrack[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  error?: string;
};

function formatPackStamp(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-")
    .toUpperCase();
}

type AtualizacoesPackBlockProps = {
  pack: AtualizacoesPackBlockData;
  canPlay: boolean;
  canDownload: boolean;
  continueContext?: {
    styleName: string;
    monthName: string;
    monthSlug: string;
    weekSlug?: string;
  };
};

export function AtualizacoesPackBlock({
  pack,
  canPlay,
  canDownload,
  continueContext,
}: AtualizacoesPackBlockProps) {
  const href = folderHref(pack.slugSegments);
  const slug = pack.slugSegments.join("/");
  const stamp = formatPackStamp(pack.modifiedAt);
  const tags = [pack.monthName, pack.weekName].filter(Boolean) as string[];

  const [tracks, setTracks] = useState(pack.tracks);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(pack.trackCount ?? pack.tracks.length);
  const [hasMore, setHasMore] = useState(
    Boolean(pack.tracksHasMore) || (pack.trackCount ?? pack.tracks.length) > pack.tracks.length,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setTracks(pack.tracks);
    setPage(1);
    setTotal(pack.trackCount ?? pack.tracks.length);
    setHasMore(Boolean(pack.tracksHasMore) || (pack.trackCount ?? pack.tracks.length) > pack.tracks.length);
    setLoadError(null);
  }, [pack.id, pack.tracks, pack.trackCount, pack.tracksHasMore]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        folderId: pack.id,
        folderName: pack.name,
        page: String(nextPage),
        limit: String(VIP_MUSIC_FEED_TRACKS_PAGE_SIZE),
      });
      const data = await fetchMusicasJson<TracksPageResponse>(`/api/musicas/tracks?${params.toString()}`);
      if (data.error) {
        setLoadError(data.error);
        return undefined;
      }
      const incoming = data.tracks ?? [];
      let merged: PreviewTrack[] = [];
      setTracks((prev) => {
        const seen = new Set(prev.map((track) => track.id));
        merged = [...prev, ...incoming.filter((track) => !seen.has(track.id))];
        return merged;
      });
      setPage(data.page ?? nextPage);
      if (typeof data.total === "number") setTotal(data.total);
      const nextHasMore = Boolean(data.hasMore);
      setHasMore(nextHasMore);
      return { tracks: merged, hasMore: nextHasMore };
    } catch {
      setLoadError("Não foi possível carregar mais faixas.");
      return undefined;
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, pack.id, pack.name, page]);

  // Completa automaticamente até listar todas as faixas do pack.
  useEffect(() => {
    if (!hasMore || loadingMore || loadError) return;
    void loadMore();
  }, [hasMore, loadError, loadMore, loadingMore, tracks.length]);

  const fileCount = total;
  const totalSize = formatBytes(pack.totalSizeBytes ?? tracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0));

  return (
    <article className={poolPanelClass}>
      <header className="border-b border-[color:var(--pool-border)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight text-[color:var(--pool-text)] sm:text-xl">
              <Link href={href} className="hover:text-[#009739]">
                {pack.name}
                {stamp ? (
                  <span className="ml-1.5 font-semibold text-[color:var(--pool-text-muted)]">[{stamp}]</span>
                ) : null}
              </Link>
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--pool-text-muted)]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--pool-chip)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--pool-text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <SendPackToDownloaderButton slug={slug} compact label={`Enviar ${pack.name} ao Downloader`} />
            <CopyPackLinkButton slugSegments={pack.slugSegments} label={`Copiar link de ${pack.name}`} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[var(--pool-stat)] px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--pool-text-muted)]">
              <Music2 className="h-3 w-3" />
              Arquivos
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-[color:var(--pool-text)]">{fileCount}</dd>
          </div>
          <div className="rounded-lg bg-[var(--pool-stat)] px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--pool-text-muted)]">
              <HardDrive className="h-3 w-3" />
              Tamanho
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-[color:var(--pool-text)]">{totalSize}</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-[var(--pool-stat)] px-3 py-2 sm:col-span-1">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--pool-text-muted)]">
              <Download className="h-3 w-3" />
              Pasta
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[#009739]">
              <Link href={href} className="hover:underline">
                Abrir
              </Link>
            </dd>
          </div>
        </dl>
      </header>

      {tracks.length > 0 ? (
        <>
          <VipMusicTrackList
            folderId={pack.id}
            tracks={tracks}
            canPlay={canPlay}
            canDownload={canDownload}
            albumTitle={pack.name}
            layout="table"
            embedded
            continueContext={continueContext}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
          <div className="border-t border-[color:var(--pool-border)] px-4 py-3 text-center">
            {loadError ? <p className="mb-2 text-xs text-red-500">{loadError}</p> : null}
            {loadingMore || hasMore ? (
              <p className="inline-flex items-center gap-2 text-[11px] text-[color:var(--pool-text-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando todas as faixas…
              </p>
            ) : (
              <p className="text-[11px] text-[color:var(--pool-text-muted)]">
                {tracks.length} faixa{tracks.length === 1 ? "" : "s"}
                {" · "}
                <Link href={href} className="font-semibold text-[#009739] hover:underline">
                  Abrir pasta
                </Link>
              </p>
            )}
            {loadError && hasMore ? (
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--pool-border)] bg-[var(--pool-surface-2)] px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--pool-text)] transition-colors hover:border-[#1ed760]/50 hover:text-[#009739] disabled:opacity-50"
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-[color:var(--pool-text-muted)]">Nenhuma faixa nesta pasta.</p>
      )}
    </article>
  );
}
