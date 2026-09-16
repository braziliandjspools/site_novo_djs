import type { Metadata } from "next";
import { buildPageMetadata, breadcrumbJsonLd, collectionPageJsonLd, SEO_PAGES } from "../../lib/seo";
import { JsonLd } from "../../components/JsonLd";

export const metadata: Metadata = buildPageMetadata("musicas-colecoes");

export default function MusicasColecoesLayout({ children }: { children: React.ReactNode }) {
  const page = SEO_PAGES["musicas-colecoes"];
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Músicas", path: "/musicas" },
          { name: "Coleções", path: "/musicas/colecoes" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Coleções para DJs",
          description: page.description,
          path: page.path,
        })}
      />
      {children}
    </>
  );
}
