import { NextResponse } from "next/server";
import { listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";

export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;

  try {
    const folders = await listVipMusicFolders(folderId);
    return NextResponse.json({ folders, ...access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar pastas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
