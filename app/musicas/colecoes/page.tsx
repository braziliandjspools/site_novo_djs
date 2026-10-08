import type { Metadata } from "next";
import { CollectionsBrowseClient } from "../components/CollectionsBrowseClient";
import { getCollectionsRootFolderId } from "../../lib/vip-collections";

export const metadata: Metadata = {
  title: "Coleções | Brazilian Remix Service",
  description: "Coleções, álbuns e discografias do acervo VIP da Brazilian Remix Service.",
};

export default async function ColecoesPage() {
  const data = await (async () => {
    const rootId = await getCollectionsRootFolderId();
    if (!rootId) {
      return {
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
    const result = await import("../../lib/vip-collections").then((m) => m.resolveCollectionsPath(""));
    return result;
  })();

  return <CollectionsBrowseClient data={data} />;
}
