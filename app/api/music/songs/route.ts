import { NextResponse } from "next/server";
import { handleAppCorsPreflight, withAppCorsJson } from "../../../lib/downloader-cors";
import { requireVipMusicAccess } from "../../../lib/vip-music-access";
import { listGeneratedSongs } from "../../../lib/music-studio/service";

export async function OPTIONS(request: Request) {
  return handleAppCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return withAppCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const favorite = searchParams.get("favorite") === "1";

  const songs = await listGeneratedSongs(access.user.id, { favorite: favorite || undefined });
  return withAppCorsJson(request, { songs });
}
