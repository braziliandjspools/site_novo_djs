import { NextResponse } from "next/server";
import { getAudioSourceUrl } from "../../lib/google-drive";

export async function POST(request: Request) {
  let id: string | undefined;

  try {
    const body = (await request.json()) as { id?: string };
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const upstream = await fetch(getAudioSourceUrl(id), {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Stream indisponível" }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("Content-Type") ?? "";
    if (contentType.includes("text/html")) {
      return NextResponse.json({ error: "Arquivo indisponível no Drive" }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Cache-Control", "private, no-store, no-cache");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Disposition", "inline");

    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Falha no stream" }, { status: 502 });
  }
}
