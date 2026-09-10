import { NextResponse } from "next/server";
import { withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { findFolderBySlug } from "../../../lib/vip-music-slugs";
import { getVipMusicCatalog, getVipMusicRootFolderId, listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";

export const revalidate = 120;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const slugParam = searchParams.get("slug") ?? "";
  const segments = slugParam.split("/").filter(Boolean);
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const rootId = getVipMusicRootFolderId();
    if (!rootId) {
      return NextResponse.json({ error: "Acervo não configurado." }, { status: 503 });
    }

    const run = async () => {
      let parentId = rootId;
      const resolvedPath: { slug: string; id: string; name: string }[] = [];
      /** Irmãos da pasta alvo (filhos do pai) — evita 2º resolve no client. */
      let siblings: { id: string; name: string }[] = [];

      for (const segment of segments) {
        const folders = await listVipMusicFolders(parentId === rootId ? undefined : parentId);
        const match = findFolderBySlug(folders, segment);
        if (!match) {
          return NextResponse.json({ error: "Pasta não encontrada." }, { status: 404 });
        }
        siblings = folders;
        resolvedPath.push({ slug: segment, id: match.id, name: match.name });
        parentId = match.id;
      }

      const target = resolvedPath.at(-1);
      const catalog = await getVipMusicCatalog(
        target?.id ?? undefined,
        target?.name ?? "Packs 2026",
      );

      return NextResponse.json({
        ...catalog,
        ...access,
        slugSegments: segments,
        resolvedPath,
        siblings,
      });
    };

    return forceRefresh ? withDriveForceRefresh(run) : run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao resolver pasta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
