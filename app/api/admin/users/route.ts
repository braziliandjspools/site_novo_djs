import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import {
  createPortalUser,
  listPortalUsersGrouped,
  normalizeServices,
  serializePortalUser,
  type CreatePortalUserInput,
  type PortalServicesInput,
} from "../../../lib/portal-users";

function parseServices(value: unknown): PortalServicesInput | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  return {
    poolsVip: Boolean(data.poolsVip),
    deemix: Boolean(data.deemix),
    allavsoft: Boolean(data.allavsoft),
  };
}

function parseMonthlyValue(value: unknown) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
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

  let body: Partial<CreatePortalUserInput & { services?: PortalServicesInput }> = {};
  try {
    body = (await request.json()) as Partial<CreatePortalUserInput & { services?: PortalServicesInput }>;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const whatsapp = body.whatsapp?.trim() ?? "";
  const services = parseServices(body.services);
  const dueDay = Number(body.dueDay);
  const monthlyValue = parseMonthlyValue(body.monthlyValue);

  if (!name || !email || !password || !whatsapp || !services) {
    return NextResponse.json(
      { error: "Campos obrigatórios: name, email, password, whatsapp, services." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return NextResponse.json({ error: "dueDay deve ser um número entre 1 e 31." }, { status: 400 });
  }

  if (monthlyValue === null) {
    return NextResponse.json({ error: "monthlyValue inválido." }, { status: 400 });
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
      services,
      monthlyValue,
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
