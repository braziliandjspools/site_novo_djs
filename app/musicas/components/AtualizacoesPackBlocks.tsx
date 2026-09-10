"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { VipMusicFolder } from "../../lib/vip-music-catalog";
import { VIP_MUSIC_FEED_TRACKS_PAGE_SIZE } from "../../lib/vip-music-catalog";
import { fetchMusicasJson, peekMusicasCache } from "../lib/musicas-fetch-cache";
import { folderHref, slugifyFolderName, displayFolderName } from "../../lib/vip-music-slugs";
import { AtualizacoesPackBlock, type AtualizacoesPackBlockData } from "./AtualizacoesPackBlock";
import { MusicasListSkeleton } from "./MusicasSkeletons";
import { poolPanelClass } from "./atualizacoes-pool-ui";

type TracksResponse = {
  tracks?: AtualizacoesPackBlockData["tracks"];
  total?: number;
  hasMore?: boolean;
  error?: string;
};

type AtualizacoesPackBlocksProps = {
  folders: VipMusicFolder[];
  slugSegments: string[];
  monthName: string;
  monthSlug: string;
  weekName?: string;
  weekSlug?: string;
  canPlay: boolean;
  canDownload: boolean;
};

export function AtualizacoesPackBlocks({
  folders,
  slugSegments,
  monthName,
  monthSlug,
  weekName,
  weekSlug,
  canPlay,
  canDownload,
}: AtualizacoesPackBlocksProps) {
  const [packs, setPacks] = useState<AtualizacoesPackBlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (folders.length === 0) {
      setPacks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loaded: AtualizacoesPackBlockData[] = [];
      const batchSize = 3;
      for (let i = 0; i < folders.length; i += batchSize) {
        const batch = folders.slice(i, i + batchSize);
        const part = await Promise.all(
          batch.map(async (folder) => {
            const nextSegments = [...slugSegments, slugifyFolderName(folder.name)];
            const url = `/api/musicas/tracks?folderId=${encodeURIComponent(folder.id)}&folderName=${encodeURIComponent(folder.name)}&limit=${VIP_MUSIC_FEED_TRACKS_PAGE_SIZE}`;
            const cached = peekMusicasCache<TracksResponse>(url);
            const data = cached ?? (await fetchMusicasJson<TracksResponse>(url));
            const tracks = data.tracks ?? [];
            return {
              id: folder.id,
              name: displayFolderName(folder.name),
              slugSegments: nextSegments,
              monthName,
              weekName: weekName ?? null,
              modifiedAt: tracks[0]?.modifiedAt ?? null,
              tracks,
              trackCount: data.total ?? tracks.length,
              totalSizeBytes: tracks.reduce((sum, track) => sum + (track.sizeBytes ?? 0), 0),
            } satisfies AtualizacoesPackBlockData;
          }),
        );
        loaded.push(...part);
        setPacks([...loaded]);
        setLoading(false);
      }
    } catch {
      setError("Não foi possível carregar os blocos desta pasta.");
    } finally {
      setLoading(false);
    }
  }, [folders, monthName, slugSegments, weekName]);

  useEffect(() => {
    void load();
  }, [load]);

  if (folders.length === 0) {
    return (
      <p className={`${poolPanelClass} px-4 py-8 text-center text-sm text-zinc-500`}>
        Nenhuma pasta nesta pasta. Adicione subpastas no Google Drive.
      </p>
    );
  }

  if (loading && packs.length === 0) {
    return <MusicasListSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : null}
      {packs.map((pack) => (
        <AtualizacoesPackBlock
          key={pack.id}
          pack={pack}
          canPlay={canPlay}
          canDownload={canDownload}
          continueContext={{
            styleName: pack.name,
            monthName,
            monthSlug,
            weekSlug,
          }}
        />
      ))}
      <p className="text-center text-xs text-zinc-500">
        <Link href={folderHref(slugSegments)} className="hover:text-white">
          {packs.length} {packs.length === 1 ? "pack" : "packs"} nesta pasta
        </Link>
      </p>
    </div>
  );
}
