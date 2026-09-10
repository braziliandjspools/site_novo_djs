"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { fetchMusicasJson } from "../lib/musicas-fetch-cache";
import { MusicasTracksSkeleton } from "./MusicasSkeletons";
import { VipMusicTrackList } from "./VipMusicTrackList";

type CollectionTracksPanelProps = {
  folderId: string;
  folderName: string;
  canPlay: boolean;
  canDownload?: boolean;
  relativePath?: string;
  coverUrl?: string | null;
  /** Primeira página já veio do resolve — evita waterfall. */
  initialTracks?: PreviewTrack[];
  initialTotal?: number;
};

type TracksResponse = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
};

export function CollectionTracksPanel({
  folderId,
  folderName,
  canPlay,
  canDownload = false,
  relativePath,
  coverUrl,
  initialTracks,
  initialTotal,
}: CollectionTracksPanelProps) {
  const hasInitial = Boolean(initialTracks?.length);
  const [tracks, setTracks] = useState<PreviewTrack[]>(initialTracks ?? []);
  const [total, setTotal] = useState(initialTotal ?? initialTracks?.length ?? 0);
  const [page, setPage] = useState(hasInitial ? 1 : 0);
  const [hasMore, setHasMore] = useState(
    hasInitial ? (initialTotal ?? 0) > (initialTracks?.length ?? 0) : false,
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          folderId,
          folderName,
          page: String(nextPage),
          limit: "50",
        });
        const data = await fetchMusicasJson<TracksResponse>(`/api/musicas/tracks?${params.toString()}`);

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
    [folderId, folderName],
  );

  useEffect(() => {
    if (initialTracks?.length) {
      setTracks(initialTracks);
      setTotal(initialTotal ?? initialTracks.length);
      setPage(1);
      setHasMore((initialTotal ?? 0) > initialTracks.length);
      setLoading(false);
      setError(null);
      return;
    }
    setTracks([]);
    setTotal(0);
    setPage(0);
    setHasMore(false);
    void loadPage(1, false);
  }, [loadPage, initialTracks, initialTotal]);

  if (loading && tracks.length === 0) {
    return <MusicasTracksSkeleton rows={6} />;
  }

  if (error && tracks.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        {error}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => void loadPage(1, false)}
            className="rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold text-black"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <VipMusicTrackList
        folderId={folderId}
        tracks={tracks}
        canPlay={canPlay}
        canDownload={canDownload}
        relativePath={relativePath}
        coverUrl={coverUrl}
        albumTitle={folderName}
        layout="discography"
        hasMore={hasMore}
        onLoadMore={async () => {
          const next = await loadPage(page + 1, true);
          return next;
        }}
      />
      {loading && tracks.length > 0 ? (
        <p className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando mais…
        </p>
      ) : null}
      {!loading && total > 0 ? (
        <p className="text-center text-[11px] text-zinc-600">
          {tracks.length} de {total} faixa{total === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
