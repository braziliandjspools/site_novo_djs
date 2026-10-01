import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../../lib/admin-auth";
import { recognizeProductionAudioFile } from "../../../../../lib/drive-production-upload";
import { uploadProductionAudioR2 } from "../../../../../lib/music-studio/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Selecione uma faixa." }, { status: 400 });
  try {
    const uploaded = await uploadProductionAudioR2(file);
    const recognized = await recognizeProductionAudioFile(file, uploaded.fileId);
    return NextResponse.json({ file: recognized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no envio para o R2.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
