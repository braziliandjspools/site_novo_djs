import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import { parseAdminScriptFields } from "../../../lib/admin-script-input";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

function unavailable() {
  return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503, headers });
}

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401, headers });
}

export async function GET(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) return unavailable();
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  try {
    const scripts = await prisma.portalAdminScript.findMany({
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    });
    return NextResponse.json({ scripts }, { headers });
  } catch (error) {
    console.error("Admin scripts list failed:", error);
    return NextResponse.json({ error: "Erro ao carregar os scripts." }, { status: 500, headers });
  }
}

export async function POST(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) return unavailable();
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400, headers });
  }

  const parsed = parseAdminScriptFields(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Dados inválidos." }, { status: 400, headers });
  }

  try {
    const script = await prisma.portalAdminScript.create({
      data: {
        title: parsed.data.title!,
        description: parsed.data.description!,
        fileName: parsed.data.fileName!,
        script: parsed.data.script!,
        language: "powershell",
        active: parsed.data.active ?? true,
      },
    });
    return NextResponse.json({ script }, { status: 201, headers });
  } catch (error) {
    console.error("Admin script create failed:", error);
    return NextResponse.json({ error: "Erro ao salvar o script." }, { status: 500, headers });
  }
}
