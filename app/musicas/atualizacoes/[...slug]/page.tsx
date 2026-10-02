import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AtualizacoesBrowseClient } from "../../components/AtualizacoesBrowseClient";
import { JsonLd } from "../../../components/JsonLd";
import {
  ATUALIZACOES_SEO_BRAND,
  breadcrumbJsonLd,
  buildAtualizacoesFolderMetadata,
  collectionPageJsonLd,
  displayFolderLabelFromSlug,
} from "../../../lib/seo";
import { listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { folderHref, slugifyFolderName } from "../../../lib/vip-music-slugs";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

function labelFromSegment(segment: string) {
  return displayFolderLabelFromSlug(segment);
}

export async function generateStaticParams() {
  try {
    const folders = await listVipMusicFolders();
    return folders
      .map((folder) => {
        const slug = slugifyFolderName(folder.name);
        return slug ? { slug: [slug] } : null;
      })
      .filter((entry): entry is { slug: string[] } => entry != null);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);
  if (segments.length === 0) return {};
  const last = segments[segments.length - 1] ?? "";
  const label = labelFromSegment(last);
  return buildAtualizacoesFolderMetadata(segments, label);
}

export default async function AtualizacoesSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const segments = (slug ?? []).map((part) => decodeURIComponent(part)).filter(Boolean);

  if (segments.length === 0) {
    redirect("/musicas/atualizacoes");
  }

  const last = segments[segments.length - 1] ?? "";
  const label = labelFromSegment(last);
  const meta = buildAtualizacoesFolderMetadata(segments, label);
  const description = typeof meta.description === "string" ? meta.description : label;
  const path = folderHref(segments);
  const pageTitle =
    typeof meta.title === "object" && meta.title && "absolute" in meta.title
      ? String(meta.title.absolute)
      : `${ATUALIZACOES_SEO_BRAND} - Atualizações ${label}`;

  const crumbs = [
    { name: "Início", path: "/" },
    { name: "Músicas", path: "/musicas" },
    { name: "Atualizações", path: "/musicas/atualizacoes" },
    ...segments.map((segment, index) => ({
      name: labelFromSegment(segment),
      path: folderHref(segments.slice(0, index + 1)),
    })),
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={collectionPageJsonLd({
          name: pageTitle,
          description,
          path,
        })}
      />
      <AtualizacoesBrowseClient slugSegments={segments} />
    </>
  );
}
