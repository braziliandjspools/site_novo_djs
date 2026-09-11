"use client";

import { useMemo } from "react";
import type { VipMusicCatalogItem, VipMusicFolder } from "../../lib/vip-music-catalog";
import {
  parseMonthStatus,
  parseYearCollectionFolder,
  sortFoldersByMonthDate,
  sortFoldersByYearCollection,
} from "../../lib/vip-music-slugs";
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderList";

type MusicasMonthLinksProps = {
  folders: Array<VipMusicFolder | VipMusicCatalogItem>;
  newFolderIds: Set<string>;
  /** Mantido por compatibilidade; a lista unificada é sempre o layout biblioteca. */
  variant?: "inline" | "hero";
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
      let badge: string | null = label || null;
      let badgeTone: LibraryFolderItem["badgeTone"] = "muted";
      if (status === "em-atualizacao") badgeTone = "amber";
      else if (status === "completo") badgeTone = "green";

      return {
        id: folder.id,
        name: folder.name,
        folderCount: catalog.folderCount,
        trackCount: catalog.trackCount,
        badge,
        badgeTone: badge ? badgeTone : undefined,
      };
    });
  }, [sorted]);

  return (
    <LibraryFolderList
      folders={items}
      slugSegments={[]}
      newFolderIds={newFolderIds}
      title="Pastas"
      description="Escolha o pack ou mês e continue até as faixas"
      descriptionMobile="Packs e meses do acervo"
      emptyMessage="Nenhum mês encontrado."
    />
  );
}
