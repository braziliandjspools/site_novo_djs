import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "@/app/lib/vip-music-access";
import { listElectronicArtistsFromDrive } from "@/app/lib/vip-electronic-artists";
import { listFeaturedKnownArtists } from "@/app/lib/vip-known-artists";
import { artistsHref } from "@/app/lib/vip-music-slugs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);

  const curated = listFeaturedKnownArtists()
    .map((artist) => ({
      slug: artist.slug,
      name: artist.name,
      imageUrl: artist.imageUrl ?? null,
      shortBio: artist.shortBio ?? null,
      bio: artist.bio ?? null,
      genres: artist.genres ?? [],
      origin: artist.origin ?? null,
      spotifyUrl: artist.spotifyUrl ?? null,
      href: artistsHref(artist.slug),
      known: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  // Falhas temporárias do Drive não devem impedir a listagem editorial.
  const discovered = await listElectronicArtistsFromDrive().catch((error) => {
    console.error("[musicas/artists] electronic discovery", error);
    return [];
  });
  const bySlug = new Map<string, (typeof curated)[number]>(curated.map((artist) => [artist.slug, artist]));
  for (const artist of discovered) {
    if (!bySlug.has(artist.slug)) bySlug.set(artist.slug, {
      slug: artist.slug,
      name: artist.name,
      imageUrl: artist.imageUrl,
      shortBio: artist.shortBio,
      bio: artist.bio,
      genres: artist.genres,
      origin: null,
      spotifyUrl: null,
      href: artist.href,
      known: artist.known,
    });
  }
  const artists = [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return NextResponse.json({ artists, count: artists.length, discoveredCount: discovered.length, ...access });
}
