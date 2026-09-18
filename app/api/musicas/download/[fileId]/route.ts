import { NextResponse } from "next/server";
import {
  contentDispositionAttachment,
  contentTypeForFilename,
  ensureAudioExtension,
  getDriveFileName,
} from "../../../../lib/google-drive";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../lib/drive-audio-stream";
import { abuseJsonBody, requireVipMusicAccess } from "../../../../lib/vip-music-access";
import { recordAndPoliceDownloadAccess } from "../../../../lib/download-abuse";

export const dynamic = "force-dynamic";
/** Permite streams longos no Dokploy/Node. */
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    if ("abuse" in access && access.abuse) {
      return NextResponse.json(abuseJsonBody(access.abuse, access.error), {
        status: access.status,
      });
    }
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const requestedName = searchParams.get("name");
  const driveName = requestedName ? null : await getDriveFileName(fileId);
  const filename = ensureAudioExtension(requestedName ?? driveName ?? "faixa.mp3");

  try {
    const abuseStatus = await recordAndPoliceDownloadAccess({
      portalUserId: access.user.id,
      fileId,
      kind: "proxy",
    });
    if (abuseStatus.banned) {
      return NextResponse.json(
        abuseJsonBody(abuseStatus, abuseStatus.message ?? "Downloads bloqueados."),
        { status: 403 },
      );
    }

    const upstream = await fetchDriveAudioUpstream(fileId, request);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    const headers = driveAudioResponseHeaders(upstream, { inline: true });
    headers.set("Content-Type", contentTypeForFilename(filename));
    headers.set("Content-Disposition", contentDispositionAttachment(filename));
    if (abuseStatus.alerted && abuseStatus.message) {
      headers.set("X-BP-Abuse-Warning", "1");
    }

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error("[musicas/download]", fileId, error);
    return NextResponse.json({ error: "Falha ao baixar." }, { status: 502 });
  }
}
