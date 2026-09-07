import { NextResponse } from "next/server";

import {
  getVipMusicSession,
  VIP_MUSIC_PREVIEW_SECONDS,
} from "../../../lib/vip-music-access";
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
      // Downloader: canPlay = acesso full. Site usa hasVip + canPreview.
      canPlay: false,
      hasVip: false,
      canPreview: true,
      previewSeconds: VIP_MUSIC_PREVIEW_SECONDS,
      planExpired: false,
      user: null,
    });
  }

  const account = buildDownloaderAccountPayload(session.user);
  const hasVip = session.canPlay;

  return withDownloaderCorsJson(request, {
    authenticated: true,
    // hasVip = tem Pools VIP (serviço). Vencimento vai em planExpired separadamente.
    canPlay: hasVip && !account.billing.expired,
    hasVip,
    canPreview: true,
    previewSeconds: hasVip ? null : VIP_MUSIC_PREVIEW_SECONDS,
    planExpired: account.billing.expired,
    user: account,
  });
}
