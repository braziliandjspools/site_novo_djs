import { NextResponse } from "next/server";

import { getVipMusicSession } from "../../../lib/vip-music-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const session = await getVipMusicSession();

  if (!session.authenticated) {
    return withDownloaderCorsJson(request, {
      authenticated: false,
      canPlay: false,
      hasVip: false,
      user: null,
    });
  }

  return withDownloaderCorsJson(request, {
    authenticated: true,
    canPlay: session.canPlay,
    hasVip: session.canPlay,
    user: {
      name: session.user.name,
      plan: session.user.plan,
    },
  });
}
