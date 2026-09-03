import { NextResponse } from "next/server";

import { getVipMusicSession } from "../../../lib/vip-music-access";
import { buildDownloaderAccountPayload } from "../../../lib/plan-billing";
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
      planExpired: false,
      user: null,
    });
  }

  const account = buildDownloaderAccountPayload(session.user);
  const hasVip = session.canPlay && !account.billing.expired;

  return withDownloaderCorsJson(request, {
    authenticated: true,
    canPlay: hasVip,
    hasVip,
    planExpired: account.billing.expired,
    user: account,
  });
}
