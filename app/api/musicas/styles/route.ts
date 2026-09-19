import { NextResponse } from "next/server";
import { getVipMusicSession, vipMusicClientAccess } from "@/app/lib/vip-music-access";
import { listVipMusicStyles } from "@/app/lib/vip-style-tracks";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getVipMusicSession();
  const access = vipMusicClientAccess(session);

  try {
    const styles = await listVipMusicStyles();
    return NextResponse.json({ styles, count: styles.length, ...access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar estilos.";
    console.error("[musicas/styles]", message);
    return NextResponse.json({ error: message, ...access }, { status: 500 });
  }
}
