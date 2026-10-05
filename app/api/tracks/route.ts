import { NextResponse } from "next/server";
import { getPreviewPlaylists } from "../../lib/google-drive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Esta API é usada pelo showcase da home. Não faça aqui o deep-walk
    // completo do acervo VIP: ele pode percorrer milhares de pastas do Drive
    // e ultrapassar o timeout do proxy/Dokploy.
    const playlists = (await getPreviewPlaylists()).slice(0, 3);
    const tracks = playlists.flatMap((playlist) => playlist.tracks);

    return NextResponse.json(
      { playlists, tracks },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar faixas";
    return NextResponse.json(
      { playlists: [], tracks: [], error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
