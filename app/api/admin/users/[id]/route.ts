import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { sendPortalPasswordChangedEmail } from "../../../../lib/portal-password-email";
import {
  deletePortalUser,
  serializePortalUser,
  updatePortalUser,
  type PortalServicesInput,
  type ServiceBillingInput,
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

function parseLineBilling(value: unknown): { value?: number; dueAt?: string | null } | null {
  if (value === undefined) return undefined as unknown as null;
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const line: { value?: number; dueAt?: string | null } = {};
  if (data.value !== undefined) {
    const parsed = Number(data.value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    line.value = Math.round(parsed * 100) / 100;
  }
  if (data.dueAt !== undefined) {
    if (data.dueAt === null || data.dueAt === "") {
      line.dueAt = null;
    } else if (typeof data.dueAt === "string") {
      line.dueAt = data.dueAt;
    } else {
      return null;
    }
  }
  return line;
}

function parseServiceBilling(value: unknown): ServiceBillingInput | null {
  if (value === undefined) return null;
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const billing: ServiceBillingInput = {};
  for (const key of ["poolsVip", "deemix", "allavsoft"] as const) {
    if (data[key] === undefined) continue;
    const line = parseLineBilling(data[key]);
    if (line === null) return null;
    billing[key] = line;
  }
  return billing;
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

  let body: UpdatePortalUserInput = {};
  try {
    body = (await request.json()) as UpdatePortalUserInput;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (body.services !== undefined && !parseServices(body.services)) {
    return NextResponse.json({ error: "services inválido." }, { status: 400 });
  }

  if (body.serviceBilling !== undefined) {
    const billing = parseServiceBilling(body.serviceBilling);
    if (!billing) {
      return NextResponse.json({ error: "serviceBilling inválido." }, { status: 400 });
    }
    body.serviceBilling = billing;
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

  if (body.email !== undefined) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    body.email = email;
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

  const passwordChanged =
    typeof body.password === "string" && body.password.trim().length >= 8
      ? body.password.trim()
      : null;

  try {
    const user = await updatePortalUser(id, {
      ...body,
      password: passwordChanged ?? undefined,
    });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    let passwordEmailSent = false;
    if (passwordChanged) {
      const mail = await sendPortalPasswordChangedEmail({
        to: user.email,
        name: user.name,
        newPassword: passwordChanged,
      });
      passwordEmailSent = mail.sent;
    }

    return NextResponse.json({
      ok: true,
      user: serializePortalUser(user),
      passwordEmailSent,
    });
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
