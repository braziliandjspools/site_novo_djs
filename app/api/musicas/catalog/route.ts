import { NextResponse } from "next/server";
import { getVipMusicCatalog } from "../../../lib/vip-music-catalog";
import { getVipMusicSession } from "../../../lib/vip-music-access";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;
  const folderName = searchParams.get("folderName") ?? undefined;

  try {
    const catalog = await getVipMusicCatalog(folderId, folderName ?? undefined);
    return NextResponse.json({
      ...catalog,
      canPlay: session.canPlay,
      authenticated: session.authenticated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar o acervo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
