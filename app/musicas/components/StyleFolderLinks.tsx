"use client";

import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import { LibraryFolderList } from "./LibraryFolderList";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

/** Navegação de estilos/subpastas — usa a lista de biblioteca compartilhada. */
export function StyleFolderLinks({ folders, slugSegments, newFolderIds }: StyleFolderLinksProps) {
  return (
    <LibraryFolderList
      className="mb-6"
      folders={folders}
      slugSegments={slugSegments}
      newFolderIds={newFolderIds}
      title="Pastas"
      description="Explore as categorias e subpastas deste pack"
      descriptionMobile="Categorias e subpastas"
      emptyMessage="Nenhuma pasta nesta pasta. Adicione subpastas no Google Drive."
    />
  );
}
