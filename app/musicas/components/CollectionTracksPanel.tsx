"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { VipMusicTrackList } from "./VipMusicTrackList";

type CollectionTracksPanelProps = {
  folderId: string;
  folderName: string;
  canPlay: boolean;
  relativePath?: string;
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
  relativePath,
}: CollectionTracksPanelProps) {
  const [tracks, setTracks] = useState<PreviewTrack[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
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
        const res = await fetch(`/api/musicas/tracks?${params.toString()}`, { cache: "no-store" });
        const data = (await res.json()) as TracksResponse;
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar faixas.");
        setTracks((prev) => (append ? [...prev, ...data.tracks] : data.tracks));
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar faixas.");
        if (!append) setTracks([]);
      } finally {
        setLoading(false);
      }
    },
    [folderId, folderName],
  );

  useEffect(() => {
    setTracks([]);
    setTotal(0);
    setPage(0);
    setHasMore(false);
    void loadPage(1, false);
  }, [loadPage]);

  if (loading && tracks.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-zinc-800 bg-[#181818]">
        <Loader2 className="h-7 w-7 animate-spin text-[#1ed760]" />
      </div>
    );
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
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-800 bg-[#181818] p-3 sm:p-4">
      <p className="px-1 text-xs text-zinc-500">
        {total} faixa{total === 1 ? "" : "s"} neste álbum
      </p>
      <VipMusicTrackList
        folderId={folderId}
        tracks={tracks}
        canPlay={canPlay}
        canDownload={canPlay}
        relativePath={relativePath}
      />
      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPage(page + 1, true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300 hover:border-[#1ed760]/40 hover:text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Carregar mais faixas
        </button>
      )}
    </section>
  );
}
