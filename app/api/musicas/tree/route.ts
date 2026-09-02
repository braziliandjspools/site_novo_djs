import { NextResponse } from "next/server";
import { listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { getVipMusicSession } from "../../../lib/vip-music-access";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;

  try {
    const folders = await listVipMusicFolders(folderId);
    return NextResponse.json({ folders, canPlay: session.canPlay, authenticated: session.authenticated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar pastas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
