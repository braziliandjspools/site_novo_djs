import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { uploadProductionFile } from "../../../../lib/drive-production-upload";
import { uploadCatalogImage } from "../../../../lib/music-studio/storage";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
  }
  try {
    if (kind === "cover" || kind === "profile") {
      const uploaded = await uploadCatalogImage(file, kind === "profile" ? "perfis" : "capas");
      return NextResponse.json({ fileId: uploaded.key, url: uploaded.url });
    }
    const uploaded = await uploadProductionFile(file, "audio");
    return NextResponse.json(uploaded);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no envio.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
