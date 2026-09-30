import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { recognizeProductionDriveLink } from "../../../../lib/drive-production-link";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const body = (await request.json().catch(() => null)) as { link?: unknown } | null;
  const link = typeof body?.link === "string" ? body.link.trim() : "";
  if (!link) return NextResponse.json({ error: "Cole o link do arquivo." }, { status: 400 });
  try {
    const file = await recognizeProductionDriveLink(link);
    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não consegui ler o link.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
