import { NextResponse } from "next/server";
import { driveAudioResponseHeaders, fetchDriveAudioUpstream } from "../../../../lib/drive-audio-stream";
import { isPublicHomePreviewTrackId } from "../../../../lib/top-downloads";

export const dynamic = "force-dynamic";

/**
 * Stream público só das faixas do ranking "mais baixadas" da home —
 * permite conhecer o acervo sem login, sem abrir o Drive inteiro.
 */
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

  const allowed = await isPublicHomePreviewTrackId(id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Prévia disponível só para as mais baixadas do momento." },
      { status: 403 },
    );
  }

  try {
    const upstream = await fetchDriveAudioUpstream(id, undefined);
    if ("error" in upstream) {
      return NextResponse.json({ error: upstream.error }, { status: upstream.status });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: driveAudioResponseHeaders(upstream, { inline: true }),
    });
  } catch {
    return NextResponse.json({ error: "Falha no stream" }, { status: 502 });
  }
}
