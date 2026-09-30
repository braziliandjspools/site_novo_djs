import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { uploadProductionFile } from "../../../../lib/drive-production-upload";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind") === "cover" ? "cover" : "audio";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
  }
  try {
    const uploaded = await uploadProductionFile(file, kind);
    return NextResponse.json(uploaded);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no envio.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
