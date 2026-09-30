import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import { parseAdminScriptFields } from "../../../lib/admin-script-input";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

function databaseErrorResponse(error: unknown) {
  console.error("Admin scripts database request failed:", error);
  const code =
    error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  if (code === "P2021" || /portal_admin_scripts|relation .* does not exist/i.test(String(error))) {
    return NextResponse.json(
      {
        error: "A tabela de scripts ainda não foi criada. Atualize o deploy; a inicialização aplica a estrutura automaticamente.",
        code: "scripts_table_missing",
      },
      { status: 503, headers },
    );
  }
  if (code === "P1001" || code === "P1017") {
    return NextResponse.json(
      { error: "O banco de dados está indisponível. Confira DATABASE_URL no ambiente do site.", code: "database_unavailable" },
      { status: 503, headers },
    );
  }
  return NextResponse.json({ error: "Erro ao carregar os scripts. Confira os logs do servidor.", code: "scripts_load_failed" }, { status: 500, headers });
}

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
    return databaseErrorResponse(error);
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
