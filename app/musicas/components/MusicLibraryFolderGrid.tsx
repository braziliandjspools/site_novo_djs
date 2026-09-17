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
  sectionTitle?: string;
  sectionDescription?: string;
  /** overlay = título na capa; below = capa colorida + título embaixo */
  caption?: "overlay" | "below";
};

export function MusicLibraryFolderGrid({
  folders,
  slugSegments,
  newFolderIds,
  emptyMessage = "Nenhuma pasta neste nível.",
  className = "",
  columns = "default",
  before,
  sectionTitle,
  sectionDescription,
  caption = "below",
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
      ? "grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
      : caption === "below"
        ? "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  return (
    <div className={className} data-layout="library-tiles">
      {before}
      <section className="mx-auto w-full max-w-[1440px]">
        {sectionTitle ? (
          <div className="mb-5 text-center sm:mb-6">
            <h2 className="text-xl font-extrabold uppercase tracking-[0.08em] text-white sm:text-2xl">
              {sectionTitle}
            </h2>
            <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-[#1ed760]/50" aria-hidden />
            {sectionDescription ? (
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/50 sm:text-[15px]">
                {sectionDescription}
              </p>
            ) : null}
          </div>
        ) : null}

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
                imageUrl={folder.coverUrl}
                caption={caption}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
