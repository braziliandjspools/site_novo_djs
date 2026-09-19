import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../components/JsonLd";
import { listFeaturedKnownArtists } from "../../lib/vip-known-artists";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  collectionPageJsonLd,
  itemListJsonLd,
  SEO_PAGES,
} from "../../lib/seo";
import { artistsHref } from "../../lib/vip-music-slugs";

export const metadata: Metadata = buildPageMetadata("musicas-artistas");

export default function ArtistasLayout({ children }: { children: React.ReactNode }) {
  const page = SEO_PAGES["musicas-artistas"];
  const artists = listFeaturedKnownArtists().sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const artistItems = artists.map((artist) => ({
    name: artist.name,
    path: artistsHref(artist.slug),
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Músicas", path: "/musicas" },
          { name: "Artistas", path: "/musicas/artistas" },
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: "Artistas do acervo VIP",
          description: page.description,
          path: page.path,
        })}
      />
      {artistItems.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: "Artistas BRS",
            path: page.path,
            items: artistItems,
          })}
        />
      ) : null}
      <nav className="sr-only" aria-label="Lista de artistas para indexação">
        <ul>
          {artistItems.map((artist) => (
            <li key={artist.path}>
              <Link href={artist.path} prefetch={false}>
                {artist.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
