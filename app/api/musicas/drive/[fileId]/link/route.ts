import { NextResponse } from "next/server";
import { getAuthorizedVipDriveTrack } from "../../../../../lib/vip-drive-view";
import { googleDriveFileLink } from "../../../../../lib/vip-drive-view-policy";
import { createExternalMusicToken, externalLinkSecret, externalMusicDownloadUrl, externalMusicFilename } from "../../../../../lib/external-music-link";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const access = await getAuthorizedVipDriveTrack(fileId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status, headers: privateHeaders });
  }
  if (new URL(request.url).searchParams.get("format") === "direct") {
    const secret = externalLinkSecret();
    if (!secret) {
      return NextResponse.json({ error: "Link direto indisponível. Configure BRS_EXTERNAL_DOWNLOAD_SECRET no servidor." }, { status: 503, headers: privateHeaders });
    }
    const token = createExternalMusicToken(fileId, access.name, secret);
    const filename = encodeURIComponent(externalMusicFilename(access.name));
    return NextResponse.json({ url: externalMusicDownloadUrl(token, filename), expiresIn: 7200 }, { headers: privateHeaders });
  }
  return NextResponse.json({ url: googleDriveFileLink(fileId) }, { headers: privateHeaders });
}
