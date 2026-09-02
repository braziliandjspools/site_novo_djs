import { NextResponse } from "next/server";
import { getVipMusicTracksPaginated, VIP_MUSIC_TRACKS_PAGE_SIZE } from "../../../lib/vip-music-catalog";
import { getVipMusicSession } from "../../../lib/vip-music-access";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId")?.trim();
  const folderName = searchParams.get("folderName")?.trim() ?? "Pasta";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? String(VIP_MUSIC_TRACKS_PAGE_SIZE));

  if (!folderId) {
    return NextResponse.json({ error: "folderId obrigatório." }, { status: 400 });
  }

  try {
    const result = await getVipMusicTracksPaginated(folderId, folderName, page, limit);
    return NextResponse.json({
      ...result,
      canPlay: session.canPlay,
      canDownload: session.canPlay,
      authenticated: session.authenticated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar faixas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
