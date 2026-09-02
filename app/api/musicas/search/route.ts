import { NextResponse } from "next/server";
import { getVipMusicSession } from "../../../lib/vip-music-access";
import { searchVipMusic } from "../../../lib/vip-music-search";

export const revalidate = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [], canPlay: session.canPlay, authenticated: session.authenticated });
  }

  try {
    const results = await searchVipMusic(query, 50);
    return NextResponse.json({ results, canPlay: session.canPlay, authenticated: session.authenticated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na busca.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
