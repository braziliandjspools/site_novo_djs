import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";
import { listCollections } from "../../../lib/vip-collections";

export const revalidate = 120;

export async function GET() {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);

  try {
    const data = await listCollections();
    return NextResponse.json({
      ...data,
      ...access,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar coleções.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
