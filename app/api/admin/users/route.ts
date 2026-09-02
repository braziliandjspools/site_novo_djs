import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import {
  createPortalUser,
  listPortalUsersGrouped,
  serializePortalUser,
  type CreatePortalUserInput,
  type PortalPlan,
} from "../../../lib/portal-users";

function parsePlan(value: unknown): PortalPlan | null {
  if (value === "NONE" || value === "VIP" || value === "DEEMIX" || value === "ALLAVSOFT") return value;
  return null;
}

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  try {
    const data = await listPortalUsersGrouped();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin users list failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao carregar clientes. Verifique o banco (npm run db:push).";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  let body: Partial<CreatePortalUserInput> = {};
  try {
    body = (await request.json()) as Partial<CreatePortalUserInput>;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const whatsapp = body.whatsapp?.trim() ?? "";
  const plan = parsePlan(body.plan);
  const dueDay = Number(body.dueDay);

  if (!name || !email || !password || !whatsapp || !plan) {
    return NextResponse.json(
      { error: "Campos obrigatórios: name, email, password, whatsapp, plan." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return NextResponse.json({ error: "dueDay deve ser um número entre 1 e 31." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  if (body.nextDueAt !== undefined && typeof body.nextDueAt !== "string") {
    return NextResponse.json({ error: "nextDueAt inválido." }, { status: 400 });
  }

  try {
    const user = await createPortalUser({
      name,
      email,
      password,
      whatsapp,
      plan,
      dueDay,
      nextDueAt: body.nextDueAt,
      active: body.active,
      notes: body.notes,
    });

    return NextResponse.json({ ok: true, user: serializePortalUser(user) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar usuário.";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
