import { NextResponse } from "next/server";
import { readDriveAudioCover } from "../../../../lib/audio-file-tags";
import { PLACEHOLDER } from "../../../../lib/theme";
import { getAuthorizedVipDriveTrack } from "../../../../lib/vip-drive-view";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

/** Artwork is served only after confirming the signed-in VIP owns access to this catalog track. */
export async function GET(request: Request, context: RouteContext) {
  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400, headers: privateHeaders });
  }

  const access = await getAuthorizedVipDriveTrack(fileId, { requireGmail: false });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status, headers: privateHeaders });
  }

  const params = new URL(request.url).searchParams;
  const modifiedAt = params.get("m");
  if (modifiedAt && (modifiedAt.length > 64 || !Number.isFinite(Date.parse(modifiedAt)))) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400, headers: privateHeaders });
  }

  try {
    const cover = await readDriveAudioCover(fileId, modifiedAt);
    if (!cover) {
      if (params.get("fallback") === "404") {
        return new NextResponse(null, { status: 404, headers: privateHeaders });
      }
      return NextResponse.redirect(new URL(PLACEHOLDER.trackCover, request.url), {
        status: 302,
        headers: privateHeaders,
      });
    }

    const headers = new Headers(privateHeaders);
    headers.set("Content-Type", cover.contentType);
    headers.set("Content-Length", String(cover.data.byteLength));
    headers.set("X-Content-Type-Options", "nosniff");
    return new NextResponse(new Uint8Array(cover.data), { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar a capa." }, { status: 502, headers: privateHeaders });
  }
}
