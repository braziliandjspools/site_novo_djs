import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "@/app/lib/vip-music-access";
import { findTracksByArtistSlug } from "@/app/lib/vip-artist-tracks";
import { slugifyArtistName } from "@/app/lib/vip-music-slugs";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { slug: raw } = await context.params;
  const slug = slugifyArtistName(decodeURIComponent(raw ?? ""));

  if (!slug) {
    return NextResponse.json({ error: "Artista inválido.", ...access }, { status: 400 });
  }

  try {
    const profile = await findTracksByArtistSlug(slug);
    const known = profile.known;
    return NextResponse.json({
      ...access,
      slug: profile.slug,
      name: profile.name,
      imageUrl: profile.imageUrl,
      shortBio: known?.shortBio ?? null,
      bio: known?.bio ?? null,
      genres: known?.genres ?? [],
      origin: known?.origin ?? null,
      yearsActive: known?.yearsActive ?? null,
      notableWorks: known?.notableWorks ?? [],
      aliases: known?.aliases ?? [],
      spotifyUrl: known?.spotifyUrl ?? null,
      known: Boolean(known),
      trackCount: profile.trackCount,
      tracks: profile.tracks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar artista.";
    console.error("[musicas/artists/slug]", message);
    return NextResponse.json({ error: message, ...access }, { status: 500 });
  }
}
