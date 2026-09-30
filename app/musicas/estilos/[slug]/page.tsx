import type { Metadata } from "next";
import { EstiloSlugClient } from "./EstiloSlugClient";
import { JsonLd } from "../../../components/JsonLd";
import { SITE_NAME } from "../../../lib/branding";
import { breadcrumbJsonLd, collectionPageJsonLd, resolveOgImagePath, SITE_URL } from "../../../lib/seo";
import { stylesHref } from "../../../lib/vip-music-slugs";

type PageProps = { params: Promise<{ slug: string }> };

function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "");
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = stylesHref(slug);
  const title = `${name} – Músicas para DJs | ${SITE_NAME}`;
  const description = `Explore todas as faixas do estilo ${name} no acervo BRS, reunidas de diferentes packs e pastas.`;
  const image = absoluteUrl(resolveOgImagePath("musicas"));
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: absoluteUrl(path), siteName: SITE_NAME, locale: "pt_BR", images: [{ url: image, width: 1200, height: 630, alt: `${name} no ${SITE_NAME}` }], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: { index: true, follow: true },
  };
}

export default async function EstiloSlugPage({ params }: PageProps) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw ?? "");
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = stylesHref(slug);
  const description = `Explore todas as faixas do estilo ${name} no acervo BRS, reunidas de diferentes packs e pastas.`;
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Músicas", path: "/musicas" },
        { name: "Estilos", path: "/musicas/estilos" },
        { name, path },
      ])} />
      <JsonLd data={collectionPageJsonLd({ name, description, path })} />
      <EstiloSlugClient slug={slug} />
    </>
  );
}
