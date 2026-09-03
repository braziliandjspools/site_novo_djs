import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import {
  deletePortalUser,
  serializePortalUser,
  updatePortalUser,
  type PortalServicesInput,
  type UpdatePortalUserInput,
} from "../../../../lib/portal-users";

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
  if (value === undefined) return undefined;
  if (value === null || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let body: UpdatePortalUserInput & { services?: PortalServicesInput } = {};
  try {
    body = (await request.json()) as UpdatePortalUserInput & { services?: PortalServicesInput };
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (body.services !== undefined && !parseServices(body.services)) {
    return NextResponse.json({ error: "services inválido." }, { status: 400 });
  }

  if (body.monthlyValue !== undefined) {
    const monthlyValue = parseMonthlyValue(body.monthlyValue);
    if (monthlyValue === null) {
      return NextResponse.json({ error: "monthlyValue inválido." }, { status: 400 });
    }
    body.monthlyValue = monthlyValue;
  }

  if (body.nextDueAt !== undefined && typeof body.nextDueAt !== "string") {
    return NextResponse.json({ error: "nextDueAt inválido." }, { status: 400 });
  }

  if (body.password !== undefined && body.password.length > 0 && body.password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  if (
    body.musicProducerDeliveriesEnabled !== undefined &&
    typeof body.musicProducerDeliveriesEnabled !== "boolean"
  ) {
    return NextResponse.json({ error: "musicProducerDeliveriesEnabled inválido." }, { status: 400 });
  }

  try {
    const user = await updatePortalUser(id, body);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user: serializePortalUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar usuário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await deletePortalUser(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
}
