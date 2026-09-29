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
  const trackOffset = Math.max(0, Number.parseInt(searchParams.get("trackOffset") ?? "0", 10) || 0);
  const trackLimit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("trackLimit") ?? "50", 10) || 50));

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
        trackOffset,
        trackLimit,
      );

      // Metadados de Pool/Estilo para qualquer nível do acervo:
      // quando a pasta atual contém MP3 diretamente, ela é o último nível.
      // Se houver uma pasta pai, ela pode representar o Pool. Não inventamos
      // valores para pastas de nível único, como packs antigos sem estilos.
      const parentFolderName = resolvedPath.at(-2)?.name?.trim() || null;
      const currentFolderName = target?.name?.trim() || null;
      const adaptedTracks = (catalog.tracks ?? []).map((track) => ({
        ...track,
        styleName:
          track.styleName?.trim() ||
          (catalog.tracks.length > 0 && currentFolderName && resolvedPath.length >= 2
            ? currentFolderName
            : null),
        poolName:
          track.poolName?.trim() ||
          (catalog.tracks.length > 0 && parentFolderName && resolvedPath.length >= 3
            ? parentFolderName
            : null),
      }));

      return NextResponse.json({
        ...catalog,
        tracks: adaptedTracks,
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
