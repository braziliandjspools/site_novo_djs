import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../components/JsonLd";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  collectionPageJsonLd,
  itemListJsonLd,
  SEO_PAGES,
} from "../../lib/seo";
import { listVipMusicStyles } from "../../lib/vip-style-tracks";
import { stylesHref } from "../../lib/vip-music-slugs";

export const metadata: Metadata = buildPageMetadata("musicas-estilos");

export default async function EstilosLayout({ children }: { children: React.ReactNode }) {
  const page = SEO_PAGES["musicas-estilos"];
  let styleItems: { name: string; path: string }[] = [];
  try {
    const styles = await listVipMusicStyles();
    styleItems = styles.map((style) => ({
      name: style.name,
      path: stylesHref(style.slug),
    }));
  } catch {
    styleItems = [];
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Músicas", path: "/musicas" },
          { name: "Estilos", path: "/musicas/estilos" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Estilos do acervo VIP",
          description: page.description,
          path: page.path,
        })}
      />
      {styleItems.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: "Estilos BRS",
            path: page.path,
            items: styleItems,
          })}
        />
      ) : null}
      <nav className="sr-only" aria-label="Lista de estilos para indexação">
        <ul>
          {styleItems.map((style) => (
            <li key={style.path}>
              <Link href={style.path} prefetch={false}>
                {style.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
