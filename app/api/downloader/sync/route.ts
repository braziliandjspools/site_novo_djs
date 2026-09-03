import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../lib/downloader-access";
import { getDownloaderSync } from "../../../lib/downloader";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const sync = await getDownloaderSync(access.user.id);
  return NextResponse.json({ ok: true, ...sync });
}
