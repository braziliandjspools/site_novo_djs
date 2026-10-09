import type { Metadata } from "next";
import { CollectionsBrowseClient } from "../components/CollectionsBrowseClient";
import { getCollectionsRootFolderId, resolveCollectionsPath } from "../../lib/vip-collections";

// O conteúdo vem de uma API externa autenticada. Não deve ser consultado durante
// o prerender do build do Next.js.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coleções | Brazilian Remix Service",
  description: "Coleções, álbuns e discografias do acervo VIP da Brazilian Remix Service.",
};

export default async function ColecoesPage() {
  let data;
  try {
    const rootId = await getCollectionsRootFolderId();
    data = rootId ? await resolveCollectionsPath("") : null;
  } catch (error) {
    console.error("[musicas/colecoes] Falha ao consultar o Google Drive:", error);
    data = null;
  }

  if (!data) {
    data = {
      configured: false,
      rootFolderId: "",
      folderId: "",
      folderName: "Coleções",
      displayName: "Coleções",
      level: "folders" as const,
      slugSegments: [],
      resolvedPath: [],
      items: [],
      tracks: [],
      albumCount: 0,
      trackCount: 0,
      coverFileId: null,
      coverUrl: null,
    };
  }

  return <CollectionsBrowseClient data={data} />;
}
