"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { collectionsHref } from "../../lib/vip-music-slugs";
import { VipUpgradeBanner } from "../VipUpgradeGate";
import { useMusicasSession } from "./MusicasSessionContext";
import { CollectionHero } from "./CollectionHero";
import { CollectionAlbumGrid } from "./CollectionAlbumGrid";
import { CollectionTracksPanel } from "./CollectionTracksPanel";
import { CollectionVolumesView } from "./CollectionVolumesView";
import { SendPackToDownloaderButton } from "./SendPackToDownloaderButton";
import { pushRecentFolder } from "../lib/music-library-storage";
import { withForcedFolderTree } from "../../lib/force-folder-tree";

type CollectionChildItem = {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  folderCount: number;
  trackCount: number;
  level: "folders" | "tracks";
  coverUrl?: string | null;
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
  coverUrl?: string | null;
  canPlay?: boolean;
  canDownload?: boolean;
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
  const canDownload = Boolean(data.canDownload);
  const packSlug = slugSegments.join("/");
  const relativePath = withForcedFolderTree(
    data.resolvedPath.map((part) => part.displayName).join("/"),
  );
  const showVolumes =
    data.level === "folders" && data.items.every((item) => item.level === "tracks");

  return (
    <div className="w-full space-y-6">
      <nav className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/musicas/colecoes"
          className="font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Coleções
        </Link>
        {data.resolvedPath.map((part, index) => {
          const href = collectionsHref(slugSegments.slice(0, index + 1));
          const isLast = index === data.resolvedPath.length - 1;
          return (
            <span key={part.id} className="contents">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="font-medium text-white">{part.displayName}</span>
              ) : (
                <Link href={href} className="font-medium text-zinc-400 transition-colors hover:text-white">
                  {part.displayName}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <CollectionHero
        title={data.displayName}
        eyebrow={data.level === "tracks" ? "Álbum" : "Coleção"}
        description={
          data.level === "tracks"
            ? "Ouça as faixas e envie o álbum ao BRS Downloader."
            : "Álbuns e volumes empilhados — ouça e envie a coletânea ao Downloader."
        }
        coverUrl={data.coverUrl}
        albumCount={data.level === "folders" ? data.albumCount : undefined}
        trackCount={data.trackCount}
        hasVip={hasVip}
        actions={
          <SendPackToDownloaderButton
            slug={packSlug}
            root="colecoes"
            label={
              data.level === "tracks"
                ? "Enviar álbum ao Downloader"
                : "Enviar coletânea ao Downloader"
            }
          />
        }
      />

      {!hasVip && authenticated && <VipUpgradeBanner />}
      {!authenticated && <VipUpgradeBanner />}

      {showVolumes ? (
        <CollectionVolumesView
          volumes={data.items.map((item) => ({
            id: item.id,
            name: item.name,
            displayName: item.displayName,
            slug: item.slug,
            trackCount: item.trackCount,
            coverUrl: item.coverUrl,
            downloaderSlug: [...slugSegments, item.slug].join("/"),
            relativePath: withForcedFolderTree(
              [...data.resolvedPath.map((part) => part.displayName), item.displayName].join("/"),
            ),
          }))}
          canPlay={canPlay}
          canDownload={canDownload}
        />
      ) : data.level === "tracks" ? (
        <CollectionTracksPanel
          folderId={data.folderId}
          folderName={data.folderName}
          canPlay={canPlay}
          canDownload={canDownload}
          relativePath={relativePath}
        />
      ) : (
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
            coverUrl: item.coverUrl,
          }))}
          emptyLabel="Nenhum disco ou pasta nesta coleção."
        />
      )}
    </div>
  );
}
