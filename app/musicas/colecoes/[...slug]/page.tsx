import type { Metadata } from "next";
import { CollectionsBrowseClient } from "../../components/CollectionsBrowseClient";
import { resolveCollectionsPath } from "../../../lib/vip-collections";

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
  const data = await resolveCollectionsPath(segments.join("/"));
  return <CollectionsBrowseClient data={data} />;
}
