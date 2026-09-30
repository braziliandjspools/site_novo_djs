import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { parseAdminScriptFields } from "../../../../lib/admin-script-input";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers });
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503, headers });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400, headers });
  }

  const parsed = parseAdminScriptFields(body, { partial: true });
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Dados inválidos." }, { status: 400, headers });
  }

  const data = { ...parsed.data };
  delete data.language;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Informe ao menos um campo para atualizar." }, { status: 400, headers });
  }

  try {
    const result = await prisma.portalAdminScript.updateMany({ where: { id }, data });
    if (result.count === 0) {
      return NextResponse.json({ error: "Script não encontrado." }, { status: 404, headers });
    }
    const script = await prisma.portalAdminScript.findUnique({ where: { id } });
    return NextResponse.json({ script }, { headers });
  } catch (error) {
    console.error("Admin script update failed:", error);
    return NextResponse.json({ error: "Erro ao atualizar o script." }, { status: 500, headers });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503, headers });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400, headers });
  }

  try {
    const result = await prisma.portalAdminScript.deleteMany({ where: { id } });
    if (result.count === 0) {
      return NextResponse.json({ error: "Script não encontrado." }, { status: 404, headers });
    }
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    console.error("Admin script delete failed:", error);
    return NextResponse.json({ error: "Erro ao excluir o script." }, { status: 500, headers });
  }
}
