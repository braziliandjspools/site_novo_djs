"use client";

import { useMemo } from "react";
import type { VipMusicCatalogItem } from "../../lib/vip-music-catalog";
import type { LibraryFolderItem } from "./LibraryFolderGrid";
import { MusicLibraryFolderGrid } from "./MusicLibraryFolderGrid";

type StyleFolderLinksProps = {
  folders: VipMusicCatalogItem[];
  slugSegments: string[];
  newFolderIds?: Set<string>;
};

/** Estilos/subpastas em tiles quadrados coloridos (estilo Amazon Music). */
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

  const novos = useMemo(
    () => (newFolderIds ? items.filter((item) => newFolderIds.has(item.id)) : []),
    [items, newFolderIds],
  );
  const demais = useMemo(
    () => (newFolderIds ? items.filter((item) => !newFolderIds.has(item.id)) : items),
    [items, newFolderIds],
  );

  return (
    <div className="mb-8 space-y-7">
      {novos.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[17px] font-bold tracking-tight text-white">Adicionadas recentemente</h2>
          <MusicLibraryFolderGrid
            folders={novos}
            slugSegments={slugSegments}
            newFolderIds={newFolderIds}
            columns="dense"
          />
        </section>
      ) : null}
      <section>
        {novos.length > 0 ? (
          <h2 className="mb-3 text-[17px] font-bold tracking-tight text-white">Todas as pastas</h2>
        ) : null}
        <MusicLibraryFolderGrid
          folders={demais.length > 0 ? demais : items}
          slugSegments={slugSegments}
          newFolderIds={newFolderIds}
          emptyMessage="Nenhuma pasta nesta pasta. Adicione subpastas no Google Drive."
        />
      </section>
    </div>
  );
}
