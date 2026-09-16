import type { Metadata } from "next";
import { ArtistaSlugClient } from "./ArtistaSlugClient";
import { findKnownArtistBySlug } from "../../../lib/vip-known-artists";
import { SITE_NAME } from "../../../lib/branding";
import { SITE_URL } from "../../../lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "");
  const known = findKnownArtistBySlug(slug);
  const name = known?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const artistSlug = known?.slug ?? slug;
  const path = `/musicas/artistas/${encodeURIComponent(artistSlug)}`;
  const title = `${name} – Remixes e faixas para DJs | BRS`;
  const description =
    known?.shortBio?.trim() ||
    `Explore o perfil de ${name} no acervo BRS: remixes, edits e faixas organizadas para DJs.`;
  const image = known?.imageUrl?.trim()
    ? absoluteUrl(known.imageUrl)
    : absoluteUrl("/images/og/default.jpg");

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: name }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArtistaSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <ArtistaSlugClient slug={decodeURIComponent(slug)} />;
}
