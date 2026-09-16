"use client";

import {
  displayFolderName,
  folderHref,
  slugifyFolderName,
} from "../../lib/vip-music-slugs";
import type { LibraryFolderItem } from "./LibraryFolderGrid";
import { MusicLibraryTile, libraryTileTone } from "./MusicLibraryTiles";

type MusicLibraryFolderGridProps = {
  folders: LibraryFolderItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
  emptyMessage?: string;
  className?: string;
  columns?: "default" | "dense";
  before?: React.ReactNode;
};

export function MusicLibraryFolderGrid({
  folders,
  slugSegments,
  newFolderIds,
  emptyMessage = "Nenhuma pasta neste nível.",
  className = "",
  columns = "default",
  before,
}: MusicLibraryFolderGridProps) {
  if (folders.length === 0) {
    return (
      <div className={className}>
        {before}
        <p className="rounded-xl bg-white/[0.03] px-4 py-10 text-center text-sm text-zinc-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const gridClass =
    columns === "dense"
      ? "grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  return (
    <div className={className} data-layout="library-tiles">
      {before}
      <div className={gridClass}>
        {folders.map((folder, index) => {
          const folderSlug = slugifyFolderName(folder.name);
          const nextSegments = [...slugSegments, folderSlug];
          const resolveSlug = nextSegments.join("/");
          const href = folderHref(nextSegments);
          const titleLabel = folder.title?.trim() || displayFolderName(folder.name);
          const badge =
            folder.badge?.trim() || (newFolderIds?.has(folder.id) ? "Novo" : null);

          return (
            <MusicLibraryTile
              key={folder.id}
              href={href}
              title={titleLabel}
              subtitle={folder.detail}
              badge={badge}
              index={index}
              tone={libraryTileTone(index)}
              resolveSlug={resolveSlug}
              trackCount={folder.trackCount}
              folderCount={folder.folderCount}
            />
          );
        })}
      </div>
    </div>
  );
}
