"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { PLACEHOLDER } from "../../lib/theme";
import { displayFolderName } from "../../lib/vip-music-slugs";
import { AtualizacoesDatePackHero } from "./AtualizacoesDatePackHero";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { useVipMusicPlayer } from "./VipMusicPlayerContext";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";

type TracksResponse = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  hasMore: boolean;
  canPlay: boolean;
  canDownload: boolean;
};

type AtualizacoesPackViewProps = {
  folderId: string;
  folderName: string;
  yearLabel?: string;
  packSlug: string;
  relativePath?: string;
  canPlay: boolean;
  isNew?: boolean;
  highlightTrackId?: string;
  autoPlayTrackId?: string;
  continueContext?: {
    styleName: string;
    monthName: string;
    monthSlug: string;
    weekSlug?: string;
  };
};

export function AtualizacoesPackView({
  folderId,
  folderName,
  yearLabel,
  packSlug,
  relativePath,
  canPlay,
  isNew = false,
  highlightTrackId,
  autoPlayTrackId,
  continueContext,
}: AtualizacoesPackViewProps) {
  const { authenticated } = useMusicasSession();
  const { setFolderPlayback } = useVipMusicPlayer();
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
        const data = (await res.json()) as TracksResponse & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar faixas.");

        setTracks((prev) => (append ? [...prev, ...data.tracks] : data.tracks));
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar faixas.");
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
  }, [folderId, loadPage]);

  useEffect(() => {
    if (!canPlay) return;
    setFolderPlayback(folderId, {
      tracks,
      hasMore,
      loadMore: async () => {
        if (!hasMore) return;
        await loadPage(page + 1, true);
      },
    });
  }, [canPlay, folderId, hasMore, loadPage, page, setFolderPlayback, tracks]);

  const label = displayFolderName(folderName);

  return (
    <div className="space-y-5">
      <AtualizacoesDatePackHero
        folderName={folderName}
        yearLabel={yearLabel}
        trackCount={total}
        isNew={isNew}
        hasVip={canPlay}
        actions={<SendPackToDownloaderButton slug={packSlug} label="Download pack" />}
      />

      {authenticated && !canPlay && <VipUpgradeBanner />}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {loading && tracks.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
        </div>
      )}

      {!loading && tracks.length === 0 && !error && (
        <p className="rounded-xl border border-zinc-800 bg-[#181818] px-4 py-10 text-center text-sm text-zinc-500">
          Nenhuma faixa neste pool.
        </p>
      )}

      {tracks.length > 0 && (
        <VipMusicTrackList
          folderId={folderId}
          tracks={tracks}
          canPlay={canPlay}
          canDownload={canPlay}
          relativePath={relativePath}
          highlightTrackId={highlightTrackId}
          autoPlayTrackId={autoPlayTrackId}
          layout="table"
          folderCoverSrc={PLACEHOLDER.trackCover}
          poolLabel={label}
          showPoolColumn
          continueContext={continueContext}
        />
      )}

      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPage(page + 1, true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#181818] py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:border-[#1ed760]/40 hover:text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Carregar mais faixas
        </button>
      )}
    </div>
  );
}
