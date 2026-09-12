"use client";

import { useMemo } from "react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import { LibraryFolderList, type LibraryFolderItem } from "./LibraryFolderGrid";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

/** Navegação de estilos/subpastas — grid de capas no acervo. */
export function StyleFolderLinks({ folders, slugSegments, newFolderIds }: StyleFolderLinksProps) {
  const items = useMemo((): LibraryFolderItem[] => {
    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      folderCount: folder.folderCount,
      trackCount: folder.trackCount,
      coverUrl: folder.coverUrl ?? null,
    }));
  }, [folders]);

  return (
    <LibraryFolderList
      className="mb-8"
      folders={items}
      slugSegments={slugSegments}
      newFolderIds={newFolderIds}
      layout="grid"
      emptyMessage="Nenhuma pasta nesta pasta. Adicione subpastas no Google Drive."
    />
  );
}
