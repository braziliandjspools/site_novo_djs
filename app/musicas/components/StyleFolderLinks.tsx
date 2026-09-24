"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Disc3, Folder, Music2 } from "lucide-react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import {
  displayFolderName,
  folderHref,
  isMonthFolderName,
  slugifyFolderName,
  sortFoldersByMonthDate,
} from "../../lib/vip-music-slugs";
import { prefetchMusicasJson } from "../lib/musicas-fetch-cache";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

const ACCENTS = ["#1ed760", "#00b4d8", "#ffdf00", "#ff6b35"];

/** Navegação de pastas com catálogo visual para DJs. */
export function StyleFolderLinks({ folders, slugSegments, newFolderIds }: StyleFolderLinksProps) {
  const monthLike =
    folders.filter((folder) => isMonthFolderName(folder.name)).length >=
    Math.max(1, Math.ceil(folders.length * 0.4));

  const ordered = useMemo(() => {
    if (monthLike) return sortFoldersByMonthDate(folders, true);
    return folders;
  }, [folders, monthLike]);

  const items = useMemo(() => {
    const newestId = ordered[0]?.id ?? null;
    return ordered.map((folder, index) => {
      const isNewest = monthLike && folder.id === newestId;
      const isNew = Boolean(newFolderIds?.has(folder.id));
      return {
        ...folder,
        index,
        isNew: isNew || isNewest,
      };
    });
  }, [ordered, monthLike, newFolderIds]);

  return (
    <section className="mb-8 w-full min-w-0 border-y border-white/10 bg-[#0b0e0d] py-3 sm:py-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-0.5 sm:mb-4 sm:px-1">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
          <Disc3 className="h-3.5 w-3.5 text-[#1ed760]" />
          Catálogo de músicas
        </div>
        <span className="font-mono text-[11px] tabular-nums text-white/40">
          {items.length.toString().padStart(2, "0")} itens
        </span>
      </div>
      <div className="space-y-2">
        {items.map((folder) => {
          const href = folderHref([...slugSegments, slugifyFolderName(folder.name)]);
          const accent = ACCENTS[folder.index % ACCENTS.length];
          const count = folder.trackCount ?? 0;
          const subfolders = folder.folderCount ?? 0;
          const hasTracks = count > 0;
          const contentLabel = hasTracks
            ? `${count} ${count === 1 ? "música" : "músicas"}`
            : `${subfolders} ${subfolders === 1 ? "pasta" : "pastas"}`;
          return (
            <Link
              key={folder.id}
              href={href}
              prefetch={false}
              onMouseEnter={() =>
                prefetchMusicasJson(
                  `/api/musicas/resolve?slug=${encodeURIComponent([...slugSegments, slugifyFolderName(folder.name)].join("/"))}`,
                )
              }
              onFocus={() =>
                prefetchMusicasJson(
                  `/api/musicas/resolve?slug=${encodeURIComponent([...slugSegments, slugifyFolderName(folder.name)].join("/"))}`,
                )
              }
              className="group relative flex min-h-[80px] w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-lg border border-white/[0.09] bg-[#101412] px-2.5 py-3 outline-none transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#161d19] hover:shadow-[0_14px_30px_-22px_rgba(30,215,96,0.8)] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#1ed760] sm:min-h-[92px] sm:gap-4 sm:px-4"
            >
              <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} aria-hidden />
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 font-mono text-6xl font-black tabular-nums text-white/[0.035] sm:text-7xl" aria-hidden>
                {String(folder.index + 1).padStart(2, "0")}
              </span>
              <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-white/70 transition-colors group-hover:border-white/20 group-hover:text-white sm:h-11 sm:w-11">
                {hasTracks ? <Music2 className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                  <span className="font-mono text-white/30">{String(folder.index + 1).padStart(2, "0")}</span>
                  {folder.isNew ? <span className="text-[#1ed760]">Novo</span> : null}
                </span>
                <span className="block truncate text-[13px] font-bold tracking-[0.02em] text-white sm:text-[15px]">
                  {displayFolderName(folder.name)}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-white/45">
                  {contentLabel}
                </span>
              </span>
              <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/45 transition-[transform,color,border-color,background-color] duration-200 group-hover:translate-x-0.5 group-hover:border-[#1ed760]/55 group-hover:bg-[#1ed760] group-hover:text-black sm:h-9 sm:w-9">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
