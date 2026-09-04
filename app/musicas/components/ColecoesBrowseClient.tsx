"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Disc3, Layers, Loader2, Music2 } from "lucide-react";
import { collectionsHref } from "../../lib/vip-music-slugs";
import { MusicasPageHeader } from "../MusicasShell";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { CollectionAlbumGrid } from "./CollectionAlbumGrid";
import { CollectionTracksPanel } from "./CollectionTracksPanel";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
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
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/musicas/colecoes/resolve?slug=${encodeURIComponent(slugPath)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = (await res.json()) as ResolveResponse;
        if (!res.ok) throw new Error(body.error ?? "Pasta não encontrada.");
        setData(body);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
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
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#1ed760] px-4 py-2 text-xs font-bold text-black"
          >
            Recarregar
          </button>
          <Link href="/musicas/colecoes" className="text-[#1ed760] hover:underline">
            Voltar para Coleções
          </Link>
        </div>
      </div>
    );
  }

  const canPlay = Boolean(data.canPlay);
  const parentSegments = slugSegments.slice(0, -1);
  const packSlug = slugSegments.join("/");
  const relativePath = data.resolvedPath.map((part) => part.displayName).join(" / ");

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
            : `${data.albumCount} pasta${data.albumCount === 1 ? "" : "s"} · ${data.trackCount} faixa${data.trackCount === 1 ? "" : "s"} listadas`
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          {data.level === "tracks" ? (
            <Disc3 className="h-3.5 w-3.5 text-[#1ed760]" />
          ) : (
            <Layers className="h-3.5 w-3.5 text-[#1ed760]" />
          )}
          {data.level === "tracks" ? "Álbum / pasta" : "Coleção / discografia"}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#181818] px-3 py-1.5 text-xs text-zinc-300">
          <Music2 className="h-3.5 w-3.5 text-[#1ed760]" />
          {data.trackCount} faixas
        </div>
        <SendPackToDownloaderButton
          slug={packSlug}
          root="colecoes"
          label={
            data.level === "tracks"
              ? "Enviar álbum ao Downloader"
              : "Enviar coletânea ao Downloader"
          }
        />
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
            downloaderSlug: [...slugSegments, item.slug].join("/"),
            isAlbum: true,
          }))}
          emptyLabel="Nenhum disco ou pasta nesta coleção."
        />
      ) : (
        <CollectionTracksPanel
          folderId={data.folderId}
          folderName={data.folderName}
          canPlay={canPlay}
          relativePath={relativePath}
        />
      )}
    </div>
  );
}
