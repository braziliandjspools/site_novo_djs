import { NextResponse } from "next/server";

/** Rota legada desativada — playback usa POST /api/stream + Web Audio API */
export async function GET() {
  return NextResponse.json({ error: "Método não disponível" }, { status: 405 });
}
