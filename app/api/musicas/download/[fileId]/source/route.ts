import { NextResponse } from "next/server";
import { getAudioSourceUrl } from "../../../../../lib/google-drive";
import { requireVipMusicAccess } from "../../../../../lib/vip-music-access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

/**
 * Devolve a URL de origem do arquivo para o app desktop baixar direto do Drive,
 * evitando o proxy do Vercel (que trava downloads longos ~3%).
 * Só para cliente desktop autenticado VIP.
 */
export async function GET(request: Request, context: RouteContext) {
  const access = await requireVipMusicAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const client = request.headers.get("X-BP-Client");
  if (client !== "downloader") {
    return NextResponse.json({ error: "Cliente não autorizado." }, { status: 403 });
  }

  const fileId = (await context.params).fileId;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    url: getAudioSourceUrl(fileId),
  });
}
