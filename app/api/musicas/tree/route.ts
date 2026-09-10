import { NextResponse } from "next/server";
import { withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";

export const revalidate = 120;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId") ?? undefined;
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const run = async () => {
      const folders = await listVipMusicFolders(folderId);
      return NextResponse.json({ folders, ...access });
    };
    return forceRefresh ? withDriveForceRefresh(run) : run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar pastas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
