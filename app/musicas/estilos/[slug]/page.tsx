import type { Metadata } from "next";
import { EstiloSlugClient } from "./EstiloSlugClient";
import { JsonLd } from "../../../components/JsonLd";
import { SITE_NAME } from "../../../lib/branding";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  SITE_URL,
} from "../../../lib/seo";
import { listVipMusicStyles } from "../../../lib/vip-style-tracks";
import { stylesHref, slugifyStyleName } from "../../../lib/vip-music-slugs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateStaticParams() {
  try {
    const styles = await listVipMusicStyles();
    return styles.map((style) => ({ slug: style.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = slugifyStyleName(decodeURIComponent(raw ?? ""));
  const name = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const path = stylesHref(slug);
  const title = `${name} – Remixes e packs para DJs | BRS`;
  const description = `Explore o estilo ${name} no acervo BRS: remixes, edits e faixas organizadas para DJs em packs e atualizações.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      images: [{ url: absoluteUrl("/images/og/default.jpg"), width: 1200, height: 630, alt: name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/og/default.jpg")],
    },
    robots: { index: true, follow: true },
  };
}

export default async function EstiloSlugPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = slugifyStyleName(decodeURIComponent(raw ?? ""));
  const name = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  const path = stylesHref(slug);
  const description = `Explore o estilo ${name} no acervo BRS: remixes, edits e faixas organizadas para DJs.`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Músicas", path: "/musicas" },
          { name: "Estilos", path: "/musicas/estilos" },
          { name: name, path },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name,
          description,
          path,
        })}
      />
      <EstiloSlugClient slug={slug} />
    </>
  );
}
