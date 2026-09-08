"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, MoreHorizontal, Pause, Play, Plus } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { PLACEHOLDER } from "../../lib/theme";
import { MusicasTracksSkeleton } from "./MusicasSkeletons";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
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
  const { playingFolderId, playingId, loadingId, toggleTrack, pause, isPlaying } = useVipMusicPlayer();
  const [tracks, setTracks] = useState<PreviewTrack[]>([]);
  const [total, setTotal] = useState(volume.trackCount);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cover = volume.coverUrl?.trim() || PLACEHOLDER.trackCover;

  const isThisAlbum = playingFolderId === volume.id;
  const albumPlaying = isThisAlbum && isPlaying && Boolean(playingId);
  const albumLoading = isThisAlbum && loadingId !== null && !playingId;

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
        return undefined;
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

  const handlePlayAlbum = async () => {
    if (!canPlay || tracks.length === 0) return;
    if (albumPlaying) {
      pause();
      return;
    }
    const first = tracks[0];
    if (first) await toggleTrack(volume.id, first.id);
  };

  const countLabel = `${total} ${total === 1 ? "música" : "músicas"}`;

  return (
    <section className="pb-10 sm:pb-14">
      {/* Cabeçalho do álbum — padrão discografia Spotify */}
      <div className="flex items-end gap-4 sm:gap-5">
        <div className="relative h-[112px] w-[112px] flex-shrink-0 overflow-hidden rounded shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:h-[136px] sm:w-[136px]">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="136px"
            unoptimized={cover.startsWith("/api/")}
          />
        </div>

        <div className="min-w-0 flex-1 pb-0.5">
          <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            {volume.displayName}
          </h2>
          <p className="mt-1.5 truncate text-sm text-zinc-400">
            Álbum <span className="text-zinc-600">•</span> {countLabel}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => void handlePlayAlbum()}
              disabled={!canPlay || tracks.length === 0 || albumLoading}
              aria-label={albumPlaying ? `Pausar ${volume.displayName}` : `Tocar ${volume.displayName}`}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-zinc-100 disabled:opacity-40"
            >
              {albumLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : albumPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
              )}
            </button>

            {canDownload ? (
              <SendPackToDownloaderButton
                slug={volume.downloaderSlug}
                root="colecoes"
                compact
                label={`Baixar ${volume.displayName}`}
                className="!h-10 !w-10 !rounded-full !border-zinc-500 !bg-transparent !text-zinc-400 hover:!border-white hover:!bg-transparent hover:!text-white"
              />
            ) : (
              <span className="inline-flex h-10 w-10 items-center justify-center text-zinc-600" title="Download VIP">
                <Download className="h-5 w-5" />
              </span>
            )}

            <span className="inline-flex h-10 w-10 items-center justify-center text-zinc-600" aria-hidden>
              <Plus className="h-5 w-5" />
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center text-zinc-600" aria-hidden>
              <MoreHorizontal className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Faixas do álbum */}
      <div className="mt-6">
        {loading && tracks.length === 0 ? (
          <MusicasTracksSkeleton rows={4} />
        ) : error && tracks.length === 0 ? (
          <p className="py-6 text-sm text-red-300">{error}</p>
        ) : tracks.length === 0 ? (
          <p className="py-6 text-sm text-zinc-500">Nenhuma faixa neste álbum.</p>
        ) : (
          <VipMusicTrackList
            folderId={volume.id}
            tracks={tracks}
            canPlay={canPlay}
            canDownload={canDownload}
            relativePath={volume.relativePath}
            layout="discography"
            hasMore={hasMore}
            onLoadMore={async () => {
              const result = await loadPage(page + 1, true);
              return result ?? undefined;
            }}
          />
        )}
        {hasMore && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadPage(page + 1, true)}
            className="mt-3 text-sm font-semibold text-zinc-400 transition hover:text-white disabled:opacity-60"
          >
            {loading ? "Carregando…" : "Mostrar mais faixas"}
          </button>
        )}
      </div>
    </section>
  );
}

/** Discografia estilo Spotify: Álbum → faixas → próximo álbum. */
export function CollectionVolumesView({ volumes, canPlay, canDownload }: CollectionVolumesViewProps) {
  if (volumes.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800 bg-[#181818] px-4 py-10 text-center text-sm text-zinc-500">
        Nenhum álbum ou volume nesta coleção.
      </p>
    );
  }

  return (
    <div className="divide-y divide-white/[0.06]">
      {volumes.map((volume) => (
        <VolumeBlock key={volume.id} volume={volume} canPlay={canPlay} canDownload={canDownload} />
      ))}
    </div>
  );
}
