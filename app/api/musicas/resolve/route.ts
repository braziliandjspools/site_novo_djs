import { NextResponse } from "next/server";
import { findFolderBySlug } from "../../../lib/vip-music-slugs";
import { getVipMusicCatalog, getVipMusicRootFolderId, listVipMusicFolders } from "../../../lib/vip-music-catalog";
import { getVipMusicSession } from "../../../lib/vip-music-access";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const { searchParams } = new URL(request.url);
  const slugParam = searchParams.get("slug") ?? "";
  const segments = slugParam.split("/").filter(Boolean);

  try {
    const rootId = getVipMusicRootFolderId();
    if (!rootId) {
      return NextResponse.json({ error: "Acervo não configurado." }, { status: 503 });
    }

    let parentId = rootId;
    const resolvedPath: { slug: string; id: string; name: string }[] = [];

    for (const segment of segments) {
      const folders = await listVipMusicFolders(parentId === rootId ? undefined : parentId);
      const match = findFolderBySlug(folders, segment);
      if (!match) {
        return NextResponse.json({ error: "Pasta não encontrada." }, { status: 404 });
      }
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
      canPlay: session.canPlay,
      authenticated: session.authenticated,
      slugSegments: segments,
      resolvedPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao resolver pasta.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
