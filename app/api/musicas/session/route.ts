import { NextResponse } from "next/server";

import { getVipMusicSession } from "../../../lib/vip-music-access";
import { buildPlanBillingPayload } from "../../../lib/plan-billing";
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

  const billing = buildPlanBillingPayload(session.user);
  const hasVip = session.canPlay && !billing.expired;

  return withDownloaderCorsJson(request, {
    authenticated: true,
    canPlay: hasVip,
    hasVip,
    planExpired: billing.expired,
    user: {
      name: session.user.name,
      plan: session.user.plan,
      email: session.user.email,
      billing,
    },
  });
}
