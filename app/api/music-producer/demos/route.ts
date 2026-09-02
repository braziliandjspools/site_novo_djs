import { NextResponse } from "next/server";
import { getMusicProducerPlaylists } from "../../../lib/google-drive";

export const revalidate = 0;

export async function GET() {
  try {
    const playlists = await getMusicProducerPlaylists();
    const tracks = playlists.flatMap((playlist) => playlist.tracks);
    return NextResponse.json({ playlists, tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar demos";
    return NextResponse.json({ playlists: [], tracks: [], error: message }, { status: 500 });
  }
}
