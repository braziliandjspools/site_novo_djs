import { NextResponse } from "next/server";
import { withDriveForceRefresh } from "../../../lib/drive-fetch-cache";
import { getVipMusicUpdatesFeed, VIP_MUSIC_FEED_PAGE_SIZE } from "../../../lib/vip-music-catalog";
import { getVipMusicSession, vipMusicClientAccess } from "../../../lib/vip-music-access";

export const revalidate = 120;

export async function GET(request: Request) {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? String(VIP_MUSIC_FEED_PAGE_SIZE));
  const monthSlug = searchParams.get("month")?.trim() || undefined;
  const weekSlug = searchParams.get("week")?.trim() || undefined;
  const forceRefresh = searchParams.get("refresh") === "1";

  try {
    const run = async () => {
      const feed = await getVipMusicUpdatesFeed({ page, pageSize, monthSlug, weekSlug });
      return NextResponse.json({ ...feed, ...access });
    };
    return forceRefresh ? withDriveForceRefresh(run) : run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar atualizações.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
