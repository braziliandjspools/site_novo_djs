import { NextResponse } from "next/server";
import { getLatestVipPreviewPlaylists } from "../../lib/vip-music-catalog";

export const revalidate = 300;

export async function GET() {
  try {
    const playlists = await getLatestVipPreviewPlaylists(3);
    const tracks = playlists.flatMap((playlist) => playlist.tracks);
    return NextResponse.json({ playlists, tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar faixas";
    return NextResponse.json({ playlists: [], tracks: [], error: message }, { status: 500 });
  }
}
