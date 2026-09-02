import { NextResponse } from "next/server";
import {
  contentDispositionAttachment,
  contentTypeForFilename,
  ensureAudioExtension,
  getAudioSourceUrl,
  getDriveFileName,
} from "../../../../lib/google-drive";
import { requireVipMusicAccess } from "../../../../lib/vip-music-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
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
    const upstream = await fetch(getAudioSourceUrl(fileId), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Download indisponível." }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("Content-Type") ?? "";
    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json") ||
      contentType.includes("text/plain")
    ) {
      return NextResponse.json({ error: "Arquivo indisponível no Drive." }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", contentTypeForFilename(filename));
    headers.set("Content-Disposition", contentDispositionAttachment(filename));
    headers.set("Cache-Control", "private, no-store, no-cache");

    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Falha ao baixar." }, { status: 502 });
  }
}
