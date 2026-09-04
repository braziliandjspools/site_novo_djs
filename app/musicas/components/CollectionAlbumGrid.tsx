"use client";

import Image from "next/image";
import Link from "next/link";
import { Disc3, FolderOpen, Music2 } from "lucide-react";
import { PLACEHOLDER } from "../../lib/theme";
import { collectionsHref } from "../../lib/vip-music-slugs";

export type CollectionCardData = {
  id: string;
  displayName: string;
  slug: string;
  albumCount: number;
  trackCount: number;
  hrefSegments?: string[];
  /** Quando true, trata como disco/álbum (mostra pastas + faixas). */
  isAlbum?: boolean;
  folderCount?: number;
};

type CollectionAlbumGridProps = {
  items: CollectionCardData[];
  emptyLabel?: string;
};

export function CollectionAlbumGrid({
  items,
  emptyLabel = "Nenhuma coleção encontrada nesta pasta.",
}: CollectionAlbumGridProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800 bg-[#181818] px-4 py-10 text-center text-sm text-zinc-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => {
        const href = collectionsHref(item.hrefSegments ?? [item.slug]);
        const albumsOrFolders = item.isAlbum ? (item.folderCount ?? 0) : item.albumCount;

        return (
          <Link
            key={item.id}
            href={href}
            className="group overflow-hidden rounded-2xl border border-zinc-800 bg-[#181818] transition-all hover:border-[#1ed760]/40 hover:bg-[#1f1f1f]"
          >
            <div className="relative aspect-square overflow-hidden bg-zinc-900">
              <Image
                src={PLACEHOLDER.trackCover}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.isAlbum ? <Disc3 className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
              </div>
            </div>
            <div className="space-y-1.5 p-3">
              <p className="line-clamp-2 text-sm font-bold leading-snug text-white">{item.displayName}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                {!item.isAlbum && (
                  <span className="inline-flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {albumsOrFolders} {albumsOrFolders === 1 ? "álbum" : "álbuns"}
                  </span>
                )}
                {item.isAlbum && albumsOrFolders > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {albumsOrFolders} {albumsOrFolders === 1 ? "pasta" : "pastas"}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Music2 className="h-3 w-3" />
                  {item.trackCount} {item.trackCount === 1 ? "faixa" : "faixas"}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
