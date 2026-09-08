import { NextResponse } from "next/server";
import { withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { getVipMusicTracksPaginated, VIP_MUSIC_TRACKS_PAGE_SIZE } from "../../../lib/vip-music-catalog";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId")?.trim();
  const folderName = searchParams.get("folderName")?.trim() ?? "Pasta";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? String(VIP_MUSIC_TRACKS_PAGE_SIZE));
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!folderId) {
    return NextResponse.json({ error: "folderId obrigatório." }, { status: 400 });
  }

  try {
    const run = async () => {
      const result = await getVipMusicTracksPaginated(folderId, folderName, page, limit);
      return NextResponse.json({
        ...result,
        ...access,
      });
    };
    return forceRefresh ? withDriveForceRefresh(run) : run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar faixas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
