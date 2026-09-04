import { NextResponse } from "next/server";
import { getVipMusicSession } from "../../../../lib/vip-music-access";
import { resolveCollectionsPath } from "../../../../lib/vip-collections";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";

  try {
    const data = await resolveCollectionsPath(slug);
    if (!data.configured && slug.length === 0) {
      return NextResponse.json({
        ...data,
        canPlay: session.canPlay,
        authenticated: session.authenticated,
        message:
          "Pasta COLEÇÕES não encontrada no Drive. Crie a pasta na raiz do acervo VIP ou defina GOOGLE_DRIVE_VIP_COLLECTIONS_FOLDER_ID.",
      });
    }
    return NextResponse.json({
      ...data,
      canPlay: session.canPlay,
      authenticated: session.authenticated,
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Erro ao resolver coleção.";
    return NextResponse.json({ error: message }, { status });
  }
}
