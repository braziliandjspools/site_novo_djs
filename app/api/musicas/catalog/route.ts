import { NextResponse } from "next/server";
import { withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { getVipMusicCatalog } from "../../../lib/vip-music-catalog";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;
  const folderName = searchParams.get("folderName") ?? undefined;
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const run = async () => {
      const catalog = await getVipMusicCatalog(folderId, folderName ?? undefined);
      return NextResponse.json({
        ...catalog,
        ...access,
      });
    };
    return forceRefresh ? withDriveForceRefresh(run) : run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar o acervo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
