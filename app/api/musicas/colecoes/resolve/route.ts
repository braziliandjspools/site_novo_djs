import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "../../../../lib/vip-music-access";
import { resolveCollectionsPath } from "../../../../lib/vip-collections";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";

  try {
    const data = await resolveCollectionsPath(slug);
    if (!data.configured && slug.length === 0) {
      return NextResponse.json({
        ...data,
        ...access,
        message:
          "Pasta COLEÇÕES não encontrada no Drive. Crie a pasta na raiz do acervo VIP ou defina GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID.",
      });
    }
    return NextResponse.json({
      ...data,
      ...access,
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Erro ao resolver coleção.";
    return NextResponse.json({ error: message }, { status });
  }
}
