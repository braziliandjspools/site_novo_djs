import { NextResponse } from "next/server";
import { getAudioSourceUrl, getDriveFileName } from "../../../../lib/google-drive";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

function contentTypeForImage(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "image/jpeg";
}

/** Proxy de capa (`folder.jpg` etc.) do Google Drive. */
export async function GET(_request: Request, context: RouteContext) {
  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const driveName = await getDriveFileName(fileId);
    const filename = driveName ?? "folder.jpg";

    const upstream = await fetch(getAudioSourceUrl(fileId), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Capa indisponível." }, { status: upstream.status || 502 });
    }

    const upstreamType = upstream.headers.get("Content-Type") ?? "";
    if (upstreamType.includes("text/html") || upstreamType.includes("application/json")) {
      return NextResponse.json({ error: "Capa indisponível no Drive." }, { status: 502 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstreamType.startsWith("image/") ? upstreamType : contentTypeForImage(filename),
    );
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Falha ao carregar capa." }, { status: 502 });
  }
}
