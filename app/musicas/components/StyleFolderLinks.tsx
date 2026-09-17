"use client";

import { useMemo } from "react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import {
  isMonthFolderName,
  sortFoldersByMonthDate,
} from "../../lib/vip-music-slugs";
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderGrid";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

/** Lista em linhas (modelo pools) — meses e estilos. */
export function StyleFolderLinks({ folders, slugSegments, newFolderIds }: StyleFolderLinksProps) {
  const monthLike =
    folders.filter((folder) => isMonthFolderName(folder.name)).length >=
    Math.max(1, Math.ceil(folders.length * 0.4));

  const ordered = useMemo(() => {
    if (monthLike) return sortFoldersByMonthDate(folders, true);
    return folders;
  }, [folders, monthLike]);

  const items = useMemo((): LibraryFolderItem[] => {
    const newestId = ordered[0]?.id ?? null;
    return ordered.map((folder, index) => {
      const isNewest = monthLike && folder.id === newestId;
      const isNew = Boolean(newFolderIds?.has(folder.id));
      let badge: string | null = null;
      let badgeTone: LibraryFolderItem["badgeTone"];
      if (isNewest) {
        badge = "Mais recente";
        badgeTone = "green";
      } else if (isNew) {
        badge = "Adicionada";
        badgeTone = "green";
      }

      return {
        id: folder.id,
        name: folder.name,
        folderCount: folder.folderCount,
        trackCount: folder.trackCount,
        coverUrl: folder.coverUrl ?? null,
        badge,
        badgeTone: badge ? badgeTone : undefined,
        // Mantém ordem visual estável para o highlight do primeiro item
        detail: index === 0 && isNewest ? "Atualização mais recente do pack" : null,
      };
    });
  }, [ordered, monthLike, newFolderIds]);

  return (
    <LibraryFolderList
      className="mb-8"
      folders={items}
      slugSegments={slugSegments}
      newFolderIds={newFolderIds}
      layout="buttons"
      fillColumn
      emptyMessage="Nenhuma pasta nesta pasta. Adicione subpastas no Google Drive."
    />
  );
}
