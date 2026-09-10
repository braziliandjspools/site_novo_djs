import { NextResponse } from "next/server";
import { readDriveAudioCover } from "../../../../lib/audio-file-tags";
import { PLACEHOLDER } from "../../../../lib/theme";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

/**
 * Serve a capa embutida nas tags do arquivo de áudio no Drive.
 * Sem capa na tag → redirect para a capa padrão BRS.
 */
export async function GET(request: Request, context: RouteContext) {
  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const modifiedAt = new URL(request.url).searchParams.get("m");

  try {
    const cover = await readDriveAudioCover(fileId, modifiedAt);
    if (!cover) {
      return NextResponse.redirect(new URL(PLACEHOLDER.trackCover, request.url), 302);
    }

    const headers = new Headers();
    headers.set("Content-Type", cover.contentType);
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    headers.set("Content-Length", String(cover.data.byteLength));

    return new NextResponse(new Uint8Array(cover.data), { status: 200, headers });
  } catch {
    return NextResponse.redirect(new URL(PLACEHOLDER.trackCover, request.url), 302);
  }
}
