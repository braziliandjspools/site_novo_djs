"use client";

import { useMemo } from "react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  parseMonthStatus,
  parseYearCollectionFolder,
  sortFoldersByMonthDate,
  sortFoldersByYearCollection,
} from "../../lib/vip-music-slugs";
import type { LibraryFolderItem } from "./LibraryFolderGrid";
import { MusicLibraryFolderGrid } from "./MusicLibraryFolderGrid";

type MusicasMonthLinksProps = {
  folders: Array<VipMusicFolder | VipMusicCatalogItem>;
  newFolderIds: Set<string>;
  variant?: "inline" | "hero";
  fillColumn?: boolean;
};

export function MusicasMonthLinks({ folders, newFolderIds }: MusicasMonthLinksProps) {
  const yearLike = folders.filter((folder) => parseYearCollectionFolder(folder.name)).length;
  const byStructure =
    yearLike >= Math.ceil(folders.length * 0.5)
      ? sortFoldersByYearCollection(folders, true)
      : sortFoldersByMonthDate(folders, true);

  const sorted = useMemo(() => {
    return [...byStructure].sort((a, b) => {
      const aNew = newFolderIds.has(a.id) ? 0 : 1;
      const bNew = newFolderIds.has(b.id) ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew;
      return byStructure.indexOf(a) - byStructure.indexOf(b);
    });
  }, [byStructure, newFolderIds]);

  const items = useMemo((): LibraryFolderItem[] => {
    return sorted.map((folder) => {
      const { label, status } = parseMonthStatus(folder.name);
      const catalog = folder as VipMusicCatalogItem;
      const badge: string | null = label || null;
      const badgeTone: LibraryFolderItem["badgeTone"] =
        status === "em-atualizacao" ? "amber" : status === "completo" ? "green" : "muted";

      return {
        id: folder.id,
        name: folder.name,
        folderCount: catalog.folderCount,
        trackCount: catalog.trackCount,
        coverUrl: catalog.coverUrl ?? null,
        badge,
        badgeTone: badge ? badgeTone : undefined,
      };
    });
  }, [sorted]);

  const novos = useMemo(
    () => items.filter((item) => newFolderIds.has(item.id)),
    [items, newFolderIds],
  );

  return (
    <div className="space-y-8">
      {novos.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">
              Novidades
            </h2>
            <span className="text-[12px] font-semibold text-white/40">{novos.length}</span>
          </div>
          <MusicLibraryFolderGrid
            folders={novos}
            slugSegments={[]}
            newFolderIds={newFolderIds}
            columns="dense"
          />
        </section>
      ) : null}

      <section id="atualizacoes-pastas">
        <div className="mb-3 px-0.5">
          <h2 className="text-[17px] font-bold tracking-tight text-white sm:text-[19px]">
            Sua biblioteca
          </h2>
          <p className="mt-1 text-[13px] text-white/45">
            Packs e meses — toque em um álbum para abrir.
          </p>
        </div>
        <MusicLibraryFolderGrid
          folders={items}
          slugSegments={[]}
          newFolderIds={newFolderIds}
          emptyMessage="Nenhum mês encontrado."
        />
      </section>
    </div>
  );
}
