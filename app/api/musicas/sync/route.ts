import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { GOOGLE_DRIVE_CACHE_TAG, withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { clearDriveChildrenMemo } from "../../../lib/google-drive";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";
import { refreshVipMusicCatalog, clearVipMusicCatalogPageCache } from "../../../lib/vip-music-catalog";
import { clearVipMusicInventoryCache } from "../../../lib/vip-music-inventory";
import { clearVipMusicSearchCaches, warmVipMusicSearchIndex } from "../../../lib/vip-music-search";

export const dynamic = "force-dynamic";

/**
 * Soft (`?soft=1`): só aquece a listagem raiz — não invalida o cache do Drive.
 * Hard (padrão / botão manual): revalida tags, limpa memos e força leitura fresca.
 */
export async function POST(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const soft = new URL(request.url).searchParams.get("soft") === "1";

  try {
    if (soft) {
      const snapshot = await refreshVipMusicCatalog();
      // Aquece o índice de pesquisa em background (não bloqueia a UI).
      void warmVipMusicSearchIndex().catch(() => undefined);
      const syncedAt = new Date().toISOString();
      return NextResponse.json({
        ok: true,
        soft: true,
        syncedAt,
        folderCount: snapshot.folderCount,
        trackCount: snapshot.trackCount,
        ...access,
      });
    }

    revalidateTag(GOOGLE_DRIVE_CACHE_TAG, { expire: 0 });
    clearVipMusicInventoryCache();
    clearVipMusicSearchCaches();
    clearVipMusicCatalogPageCache();
    clearDriveChildrenMemo();

    const snapshot = await withDriveForceRefresh(() => refreshVipMusicCatalog());
    void warmVipMusicSearchIndex().catch(() => undefined);
    const syncedAt = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      soft: false,
      syncedAt,
      folderCount: snapshot.folderCount,
      trackCount: snapshot.trackCount,
      ...access,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao sincronizar o Drive.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
