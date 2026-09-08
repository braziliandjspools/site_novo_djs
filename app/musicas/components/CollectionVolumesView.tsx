"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { PLACEHOLDER } from "../../lib/theme";
import { MusicasTracksSkeleton } from "./MusicasSkeletons";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { VipMusicTrackList } from "./VipMusicTrackList";

export type CollectionVolumeItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  trackCount: number;
  coverUrl?: string | null;
  downloaderSlug: string;
  relativePath: string;
};

type CollectionVolumesViewProps = {
  volumes: CollectionVolumeItem[];
  canPlay: boolean;
  canDownload: boolean;
};

type TracksResponse = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
};

function VolumeBlock({
  volume,
  canPlay,
  canDownload,
}: {
  volume: CollectionVolumeItem;
  canPlay: boolean;
  canDownload: boolean;
}) {
  const [tracks, setTracks] = useState<PreviewTrack[]>([]);
  const [total, setTotal] = useState(volume.trackCount);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cover = volume.coverUrl?.trim() || PLACEHOLDER.trackCover;

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          folderId: volume.id,
          folderName: volume.name,
          page: String(nextPage),
          limit: "50",
        });
        const res = await fetch(`/api/musicas/tracks?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as TracksResponse;
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar faixas.");

        let resolvedTracks: PreviewTrack[] = data.tracks;
        if (append) {
          setTracks((prev) => {
            resolvedTracks = [...prev, ...data.tracks];
            return resolvedTracks;
          });
        } else {
          setTracks(data.tracks);
        }
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
        return { tracks: resolvedTracks, hasMore: data.hasMore };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar faixas.");
        if (!append) setTracks([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [volume.id, volume.name],
  );

  useEffect(() => {
    setTracks([]);
    setPage(0);
    setHasMore(false);
    void loadPage(1, false);
  }, [loadPage]);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#141414]">
      <div className="flex flex-wrap items-center gap-4 border-b border-zinc-800/80 px-4 py-4 sm:px-5">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md shadow-lg ring-1 ring-white/10 sm:h-20 sm:w-20">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={cover.startsWith("/api/")}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Álbum / Volume</p>
          <h2 className="mt-0.5 truncate text-lg font-black text-white sm:text-xl">{volume.displayName}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {total} {total === 1 ? "faixa" : "faixas"}
          </p>
        </div>
        <SendPackToDownloaderButton
          slug={volume.downloaderSlug}
          root="colecoes"
          label="Enviar volume ao Downloader"
        />
      </div>

      <div className="p-2 sm:p-3">
        {loading && tracks.length === 0 ? (
          <MusicasTracksSkeleton rows={4} />
        ) : error && tracks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-red-300">{error}</p>
        ) : tracks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-zinc-500">Nenhuma faixa neste volume.</p>
        ) : (
          <VipMusicTrackList
            folderId={volume.id}
            tracks={tracks}
            canPlay={canPlay}
            canDownload={canDownload}
            relativePath={volume.relativePath}
            layout="table"
            hasMore={hasMore}
            onLoadMore={async () => loadPage(page + 1, true)}
          />
        )}
        {hasMore && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadPage(page + 1, true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300 hover:border-[#1ed760]/40 hover:text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Carregar mais faixas
          </button>
        )}
      </div>
    </section>
  );
}

/** Lista estilo Spotify: volumes empilhados com faixas. */
export function CollectionVolumesView({ volumes, canPlay, canDownload }: CollectionVolumesViewProps) {
  if (volumes.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800 bg-[#181818] px-4 py-10 text-center text-sm text-zinc-500">
        Nenhum álbum ou volume nesta coleção.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {volumes.map((volume) => (
        <VolumeBlock key={volume.id} volume={volume} canPlay={canPlay} canDownload={canDownload} />
      ))}
    </div>
  );
}
