import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";
import { searchVipMusic, warmVipMusicSearchIndex } from "../../../lib/vip-music-search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    void warmVipMusicSearchIndex().catch(() => undefined);
    return NextResponse.json({ results: [], ...access });
  }

  try {
    const results = await searchVipMusic(query, 36);
    return NextResponse.json({ results, ...access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na busca.";
    console.error("[musicas/search]", message);
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}
