import { slugifyFolderName } from "./vip-music-slugs";

/**
 * Capas estáticas das pastas raiz do acervo (mesmo “slug” do nome da pasta).
 * Coloque arquivos em `/public/musicas/folder-covers/<slug>.jpg|png|webp`.
 */
const LOCAL_FOLDER_COVER_BY_SLUG: Record<string, string> = {
  "brs-packs-2025": "/musicas/folder-covers/brs-packs-2025.jpg",
  "brs-packs-2026": "/musicas/folder-covers/brs-packs-2026.jpg",
};

/** Normaliza nomes tipo "BRS - PACKS 2025" / "BRS PACKS 2025" para o slug do cover. */
export function localFolderCoverUrl(folderName: string): string | null {
  const slug = slugifyFolderName(folderName);
  if (!slug) return null;
  if (LOCAL_FOLDER_COVER_BY_SLUG[slug]) return LOCAL_FOLDER_COVER_BY_SLUG[slug]!;

  // Fallbacks leves: packs-2025, brs-packs-2025, etc.
  const yearPack = slug.match(/(?:^|-)(packs?)-(\d{4})$/);
  if (yearPack) {
    const key = `brs-packs-${yearPack[2]}`;
    if (LOCAL_FOLDER_COVER_BY_SLUG[key]) return LOCAL_FOLDER_COVER_BY_SLUG[key]!;
  }
  return null;
}

export function resolveFolderCoverUrl(input: {
  folderName: string;
  driveCoverUrl?: string | null;
}): string | null {
  const local = localFolderCoverUrl(input.folderName);
  if (local) return local;
  const drive = input.driveCoverUrl?.trim();
  return drive || null;
}
