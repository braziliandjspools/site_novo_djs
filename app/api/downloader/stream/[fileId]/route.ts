import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../lib/drive-audio-stream";
import { handleDownloaderCorsPreflight, withDownloaderCors, withDownloaderCorsJson } from "../../../../lib/downloader-cors";
import { BRS_MUSIC_SEARCH_ENABLED } from "../../../../lib/feature-flags";
import { findUserById, userHasPools } from "../../../../lib/portal-users";
import { getAuthenticatedPortalUser, parsePortalToken } from "../../../../lib/portal";
import { isDownloaderPlanExpired } from "../../../../lib/plan-billing";
import { getSendNowDirectUrl, isSendNowFileId, sendNowFileCode } from "../../../../lib/send-now";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

async function resolveDownloaderStreamUser(request: Request) {
  const fromSession = await getAuthenticatedPortalUser();
  if (fromSession) return fromSession;

  const token = new URL(request.url).searchParams.get("access_token")?.trim();
  if (!token) return null;
  const userId = parsePortalToken(token);
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user || !user.active) return null;
  return user;
}

export async function GET(request: Request, context: RouteContext) {
  if (!BRS_MUSIC_SEARCH_ENABLED) {
    return withDownloaderCorsJson(
      request,
      { error: "Buscador de músicas desativado neste ambiente." },
      { status: 404 },
    );
  }

  const user = await resolveDownloaderStreamUser(request);
  if (!user) {
    return withDownloaderCorsJson(request, { error: "Faça login para ouvir." }, { status: 401 });
  }
  if (!userHasPools(user) || isDownloaderPlanExpired(user)) {
    return withDownloaderCorsJson(
      request,
      { error: "Plano VIP necessário para ouvir as faixas." },
      { status: 403 },
    );
  }

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return withDownloaderCorsJson(request, { error: "ID inválido." }, { status: 400 });
  }

  if (isSendNowFileId(fileId)) {
    try {
      return withDownloaderCors(
        request,
        NextResponse.redirect(await getSendNowDirectUrl(sendNowFileCode(fileId)), 302),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no send.now.";
      return withDownloaderCorsJson(request, { error: message }, { status: 502 });
    }
  }

  try {
    const upstream = await fetchDriveAudioUpstream(fileId, request);
    if ("error" in upstream) {
      return withDownloaderCorsJson(request, { error: upstream.error }, { status: upstream.status });
    }

    return withDownloaderCors(
      request,
      new NextResponse(upstream.body, {
        status: upstream.status,
        headers: driveAudioResponseHeaders(upstream, { inline: true }),
      }),
    );
  } catch (error) {
    console.error("[downloader/stream]", fileId, error);
    return withDownloaderCorsJson(request, { error: "Falha no stream." }, { status: 502 });
  }
}
