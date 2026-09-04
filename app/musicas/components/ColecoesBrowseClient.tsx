"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Disc3, Layers, Loader2, Music2 } from "lucide-react";
import type { PreviewTrack } from "../../lib/google-drive";
import { collectionsHref } from "../../lib/vip-music-slugs";
import { MusicasPageHeader } from "../MusicasShell";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { CollectionAlbumGrid } from "./CollectionAlbumGrid";
import { VipMusicTrackList } from "./VipMusicTrackList";
import { pushRecentFolder } from "../lib/music-library-storage";

type CollectionChildItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  folderCount: number;
  trackCount: number;
  level: "folders" | "tracks";
};

type ResolveResponse = {
  configured: boolean;
  folderId: string;
  folderName: string;
  displayName: string;
  level: "folders" | "tracks";
  slugSegments: string[];
  resolvedPath: { slug: string; id: string; name: string; displayName: string }[];
  items: CollectionChildItem[];
  tracks: PreviewTrack[];
  albumCount: number;
  trackCount: number;
  canPlay?: boolean;
  message?: string;
  error?: string;
};

type ColecoesBrowseClientProps = {
  slugSegments: string[];
};

export function ColecoesBrowseClient({ slugSegments }: ColecoesBrowseClientProps) {
  const { authenticated, hasVip } = useMusicasSession();
  const [data, setData] = useState<ResolveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slugPath = slugSegments.join("/");

  useEffect(() => {
    setLoading(true);
    setError(null);
    void fetch(`/api/musicas/colecoes/resolve?slug=${encodeURIComponent(slugPath)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json()) as ResolveResponse;
        if (!res.ok) throw new Error(body.error ?? "Pasta não encontrada.");
        setData(body);
      })
      .catch((err: Error) => {
        setError(err.message);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [slugPath]);

  useEffect(() => {
    if (!data) return;
    pushRecentFolder({
      name: data.displayName,
      href: collectionsHref(slugSegments),
    });
  }, [data, slugSegments]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1ed760]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        {error ?? "Não foi possível abrir esta coleção."}
        <div className="mt-4">
          <Link href="/musicas/colecoes" className="text-[#1ed760] hover:underline">
            Voltar para Coleções
          </Link>
        </div>
      </div>
    );
  }

  const canPlay = Boolean(data.canPlay);
  const parentSegments = slugSegments.slice(0, -1);
  const isAlbumLevel = slugSegments.length >= 2 || (slugSegments.length === 1 && data.level === "tracks");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/musicas/colecoes" className="hover:text-[#1ed760]">
          Coleções
        </Link>
        {data.resolvedPath.map((part, index) => {
          const href = collectionsHref(slugSegments.slice(0, index + 1));
          const isLast = index === data.resolvedPath.length - 1;
          return (
            <span key={part.id} className="inline-flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" />
              {isLast ? (
                <span className="font-semibold text-zinc-300">{part.displayName}</span>
              ) : (
                <Link href={href} className="hover:text-[#1ed760]">
                  {part.displayName}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <MusicasPageHeader
        title={data.displayName}
        subtitle={
          data.level === "tracks"
            ? `${data.trackCount} faixa${data.trackCount === 1 ? "" : "s"} nesta pasta`
            : `${data.albumCount} pasta${data.albumCount === 1 ? "" : "s"} · ${data.trackCount} faixa${data.trackCount === 1 ? "" : "s"} no total`
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          {data.level === "tracks" ? <Disc3 className="h-3.5 w-3.5 text-[#1ed760]" /> : <Layers className="h-3.5 w-3.5 text-[#1ed760]" />}
          {data.level === "tracks" ? "Álbum / pasta" : "Coleção / discografia"}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          <Music2 className="h-3.5 w-3.5 text-[#1ed760]" />
          {data.trackCount} faixas
        </div>
        {parentSegments.length > 0 && (
          <Link
            href={collectionsHref(parentSegments)}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[#1ed760]/40 hover:text-white"
          >
            Voltar
          </Link>
        )}
      </div>

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      {data.level === "folders" ? (
        <CollectionAlbumGrid
          items={data.items.map((item) => ({
            id: item.id,
            displayName: item.displayName,
            slug: item.slug,
            albumCount: item.folderCount,
            folderCount: item.folderCount,
            trackCount: item.trackCount,
            hrefSegments: [...slugSegments, item.slug],
            isAlbum: true,
          }))}
          emptyLabel="Nenhum disco ou pasta nesta coleção."
        />
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-[#181818] p-3 sm:p-4">
          <VipMusicTrackList
            folderId={data.folderId}
            tracks={data.tracks}
            canPlay={canPlay}
            canDownload={canPlay}
            relativePath={data.resolvedPath.map((part) => part.displayName).join(" / ")}
          />
        </section>
      )}

      {isAlbumLevel && data.level === "folders" && data.items.length === 0 && (
        <p className="text-center text-sm text-zinc-500">Esta pasta ainda não tem conteúdo listável.</p>
      )}
    </div>
  );
}
