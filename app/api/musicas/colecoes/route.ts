import { NextResponse } from "next/server";
import { getVipMusicSession } from "../../../lib/vip-music-access";
import { listCollections } from "../../../lib/vip-collections";

export const revalidate = 60;

export async function GET() {
  const session = await getVipMusicSession();

  try {
    const data = await listCollections();
    return NextResponse.json({
      ...data,
      canPlay: session.canPlay,
      authenticated: session.authenticated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar coleções.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
