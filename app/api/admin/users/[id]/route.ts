import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import {
  deletePortalUser,
  serializePortalUser,
  updatePortalUser,
  type PortalPlan,
  type UpdatePortalUserInput,
} from "../../../../lib/portal-users";

function parsePlan(value: unknown): PortalPlan | null {
  if (value === "NONE" || value === "VIP" || value === "DEEMIX" || value === "ALLAVSOFT") return value;
  return null;
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

  let body: UpdatePortalUserInput = {};
  try {
    body = (await request.json()) as UpdatePortalUserInput;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (body.plan !== undefined && !parsePlan(body.plan)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  if (body.dueDay !== undefined && (!Number.isInteger(body.dueDay) || body.dueDay < 1 || body.dueDay > 31)) {
    return NextResponse.json({ error: "dueDay deve ser entre 1 e 31." }, { status: 400 });
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
