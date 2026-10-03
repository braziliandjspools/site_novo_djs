"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Disc3, Download, HardDrive, Music2 } from "lucide-react";
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
  coverUrl?: string | null;
  tracks: PreviewTrack[];
  trackCount?: number;
  totalSizeBytes?: number;
};

type TracksPageResponse = {
  tracks?: PreviewTrack[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  error?: string;
};

function formatPackDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

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
  const dateLabel = formatPackDate(pack.modifiedAt);
  const stamp = formatPackStamp(pack.modifiedAt);
  const tags = [pack.monthName, pack.weekName].filter(Boolean) as string[];
  const newestAt = pack.modifiedAt ? Date.parse(pack.modifiedAt) : NaN;
  const isRecent = Number.isFinite(newestAt) && newestAt <= Date.now() && Date.now() - newestAt < 7 * 86_400_000;

  const [tracks, setTracks] = useState(pack.tracks);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(pack.trackCount ?? pack.tracks.length);
  const [hasMore, setHasMore] = useState((pack.trackCount ?? pack.tracks.length) > pack.tracks.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setTracks(pack.tracks);
    setPage(1);
    setTotal(pack.trackCount ?? pack.tracks.length);
    setHasMore((pack.trackCount ?? pack.tracks.length) > pack.tracks.length);
    setLoadError(null);
  }, [pack.id, pack.tracks, pack.trackCount]);

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

  const fileCount = total;
  const totalSize = formatBytes(pack.totalSizeBytes ?? tracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0));

  return (
    <article className={`${poolPanelClass} overflow-hidden rounded-[22px] border border-[#60cdff]/20 bg-[#101210] shadow-[0_24px_60px_-35px_rgba(96,205,255,0.4)]`}>
      <header className={`relative overflow-hidden border-b px-4 py-5 sm:px-6 sm:py-6 ${isRecent ? "border-[#60cdff]/30 bg-gradient-to-r from-green-500/[0.17] via-[#20172c] to-[#101210]" : "border-white/[0.08] bg-gradient-to-r from-[#182018] to-[#101210]"}`}>
        <Disc3 className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 text-[#8ad4ff]/[0.055]" strokeWidth={0.7} aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isRecent ? <span className="mb-2 inline-flex rounded-full border border-[#60cdff]/40 bg-[#60cdff]/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#86efac]">Novidades · últimos 7 dias</span> : null}
            <h2 className="text-lg font-black tracking-tight text-white sm:text-2xl">
              <Link href={href} className="hover:text-[#8ad4ff]">
                {pack.name}
                {stamp ? <span className="ml-1.5 font-semibold text-zinc-400">[{stamp}]</span> : null}
              </Link>
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
              {dateLabel ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateLabel}
                </span>
              ) : null}
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
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

        <dl className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-[#60cdff]/10 bg-black/20 px-3 py-3">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <Music2 className="h-3 w-3" />
              Arquivos
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-white">{fileCount}</dd>
          </div>
          <div className="rounded-lg bg-black/35 px-3 py-2">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <HardDrive className="h-3 w-3" />
              Tamanho
            </dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-white">{totalSize}</dd>
          </div>
          <div className="col-span-2 rounded-xl border border-[#60cdff]/10 bg-black/20 px-3 py-3 sm:col-span-1">
            <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
              <Download className="h-3 w-3" />
              Pasta
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[#8ad4ff]">
              <Link href={href} className="hover:underline">
                Abrir catálogo <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
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
            coverUrl={pack.coverUrl}
            albumTitle={pack.name}
            layout="table"
            embedded
            continueContext={continueContext}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
          <div className="border-t border-white/[0.06] px-4 py-3 text-center">
            {loadError ? <p className="mb-2 text-xs text-red-400">{loadError}</p> : null}
            <p className="mt-2 text-[11px] text-zinc-500">
              Mostrando {tracks.length} de {fileCount} faixas
              {!hasMore ? (
                <>
                  .{" "}
                  <Link href={href} className="font-semibold text-[#60cdff] hover:underline">
                    Abrir pasta
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">Nenhuma faixa nesta pasta.</p>
      )}
    </article>
  );
}
