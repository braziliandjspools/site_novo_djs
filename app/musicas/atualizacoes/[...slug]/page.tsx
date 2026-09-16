import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AtualizacoesBrowseClient } from "../../components/AtualizacoesBrowseClient";
import { buildAtualizacoesFolderMetadata } from "../../../lib/seo";
import { displayFolderName } from "../../../lib/vip-music-slugs";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);
  if (segments.length === 0) return {};
  const last = segments[segments.length - 1] ?? "";
  const label = displayFolderName(last.replace(/-/g, " "));
  return buildAtualizacoesFolderMetadata(segments, label);
}

export default async function AtualizacoesSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);

  if (segments.length === 0) {
    redirect("/musicas/atualizacoes");
  }

  return <AtualizacoesBrowseClient slugSegments={segments} />;
}
