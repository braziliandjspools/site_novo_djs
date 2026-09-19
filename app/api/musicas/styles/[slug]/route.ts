import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "@/app/lib/vip-music-access";
import { findTracksByStyleSlug } from "@/app/lib/vip-style-tracks";
import { slugifyStyleName } from "@/app/lib/vip-music-slugs";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { slug: raw } = await context.params;
  const slug = slugifyStyleName(decodeURIComponent(raw ?? ""));

  if (!slug) {
    return NextResponse.json({ error: "Estilo inválido.", ...access }, { status: 400 });
  }

  try {
    const profile = await findTracksByStyleSlug(slug);
    return NextResponse.json({
      ...access,
      slug: profile.slug,
      name: profile.name,
      imageUrl: profile.imageUrl,
      trackCount: profile.trackCount,
      folderCount: profile.folderCount,
      tracks: profile.tracks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar estilo.";
    console.error("[musicas/styles/slug]", message);
    return NextResponse.json({ error: message, ...access }, { status: 500 });
  }
}
