"use client";

import { useMemo } from "react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import { resolveFolderCoverUrl } from "../../lib/local-folder-covers";
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

export function MusicasMonthLinks({
  folders,
  newFolderIds,
}: MusicasMonthLinksProps) {
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
    const newestId = sorted[0]?.id ?? null;
    return sorted.map((folder) => {
      const { label, status } = parseMonthStatus(folder.name);
      const catalog = folder as VipMusicCatalogItem;
      const isNewest = folder.id === newestId;
      const isNew = newFolderIds.has(folder.id);

      let badge: string | null = null;
      let badgeTone: LibraryFolderItem["badgeTone"];
      if (isNewest) {
        badge = "Mais recente";
        badgeTone = "green";
      } else if (isNew) {
        badge = "Novo";
        badgeTone = "green";
      } else if (label) {
        badge = label;
        badgeTone =
          status === "em-atualizacao" ? "amber" : status === "completo" ? "green" : "muted";
      }

      return {
        id: folder.id,
        name: folder.name,
        folderCount: catalog.folderCount,
        trackCount: catalog.trackCount,
        coverUrl: resolveFolderCoverUrl({
          folderName: folder.name,
          driveCoverUrl: catalog.coverUrl,
        }),
        badge,
        badgeTone: badge ? badgeTone : undefined,
      };
    });
  }, [sorted, newFolderIds]);

  return (
    <MusicLibraryFolderGrid
      folders={items}
      slugSegments={[]}
      newFolderIds={newFolderIds}
      caption="below"
      centerItems
      sectionTitle="Seu acervo"
      sectionDescription="Pastas do mês e packs prontos para ouvir ou baixar."
      emptyMessage="Nenhum mês encontrado."
    />
  );
}
