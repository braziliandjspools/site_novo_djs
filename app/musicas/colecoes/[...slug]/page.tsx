import type { Metadata } from "next";
import { CollectionsBrowseClient } from "../../components/CollectionsBrowseClient";
import { resolveCollectionsPath } from "../../../lib/vip-collections";

// A navegação depende do Google Drive e deve ser resolvida em runtime, não no build.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = decodeURIComponent(slug?.at(-1) ?? "Coleções");
  return {
    title: `${label} | Coleções | Brazilian Remix Service`,
    description: `Coleção ${label} no acervo VIP da Brazilian Remix Service.`,
  };
}

export default async function ColecoesSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);

  try {
    const data = await resolveCollectionsPath(segments.join("/"));
    return <CollectionsBrowseClient data={data} />;
  } catch (error) {
    console.error("[musicas/colecoes/[...slug]] Falha ao consultar o Google Drive:", error);
    const data = {
      configured: false,
      rootFolderId: "",
      folderId: "",
      folderName: segments.at(-1) ?? "Coleções",
      displayName: segments.at(-1) ?? "Coleções",
      level: "folders" as const,
      slugSegments: segments,
      resolvedPath: [],
      items: [],
      tracks: [],
      albumCount: 0,
      trackCount: 0,
      coverFileId: null,
      coverUrl: null,
    };
    return <CollectionsBrowseClient data={data} />;
  }
}
