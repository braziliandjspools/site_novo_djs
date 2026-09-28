import { NextResponse } from "next/server";
import { getAuthorizedVipDriveTrack } from "../../../../../lib/vip-drive-view";
import { googleDriveFileLink } from "../../../../../lib/vip-drive-view-policy";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const access = await getAuthorizedVipDriveTrack(fileId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status, headers: privateHeaders });
  }
  return NextResponse.json({ url: googleDriveFileLink(fileId) }, { headers: privateHeaders });
}
