import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "@/app/lib/vip-music-access";
import { listFeaturedKnownArtists } from "@/app/lib/vip-known-artists";
import { artistsHref } from "@/app/lib/vip-music-slugs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);

  const artists = listFeaturedKnownArtists().map((artist) => ({
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
  }));

  return NextResponse.json({ artists, ...access });
}
