import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { GOOGLE_DRIVE_CACHE_TAG, withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";
import { listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { clearVipMusicInventoryCache } from "../../../lib/vip-music-inventory";

export const dynamic = "force-dynamic";

/** Força atualização do cache do Google Drive e aquece a listagem raiz. */
export async function POST() {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);

  try {
    revalidateTag(GOOGLE_DRIVE_CACHE_TAG, { expire: 0 });
    clearVipMusicInventoryCache();

    const folders = await withDriveForceRefresh(() => listVipMusicFolders());
    const syncedAt = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      syncedAt,
      folderCount: folders.length,
      ...access,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao sincronizar o Drive.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
