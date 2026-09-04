import { NextResponse } from "next/server";
import type { SiteNoticeAudience, SiteNoticeSeverity } from "@prisma/client";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { deleteSiteNotice, updateSiteNotice } from "../../../../lib/site-notices";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function parseSeverity(value: unknown): SiteNoticeSeverity | undefined {
  if (value === undefined) return undefined;
  if (value === "INFO" || value === "SUCCESS" || value === "WARNING" || value === "ERROR") {
    return value;
  }
  return undefined;
}

function parseAudience(value: unknown): SiteNoticeAudience | undefined {
  if (value === undefined) return undefined;
  if (value === "GLOBAL" || value === "USER") return value;
  return undefined;
}

function parseOptionalDate(value: unknown) {
  if (value === null || value === "") return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const severity = parseSeverity(body.severity);
  const audience = parseAudience(body.audience);
  const startsAt = parseOptionalDate(body.startsAt);
  const endsAt = parseOptionalDate(body.endsAt);

  if (body.severity !== undefined && !severity) {
    return NextResponse.json({ error: "severity inválido." }, { status: 400 });
  }
  if (body.audience !== undefined && !audience) {
    return NextResponse.json({ error: "audience inválido." }, { status: 400 });
  }
  if (startsAt === undefined && body.startsAt !== undefined) {
    return NextResponse.json({ error: "startsAt inválido." }, { status: 400 });
  }
  if (endsAt === undefined && body.endsAt !== undefined) {
    return NextResponse.json({ error: "endsAt inválido." }, { status: 400 });
  }

  try {
    const notice = await updateSiteNotice(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      severity,
      audience,
      portalUserId:
        body.portalUserId === undefined
          ? undefined
          : body.portalUserId === null || body.portalUserId === ""
            ? null
            : Number(body.portalUserId),
      active: body.active === undefined ? undefined : Boolean(body.active),
      startsAt,
      endsAt,
    });
    if (!notice) return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
    return NextResponse.json({ notice });
  } catch (error) {
    console.error("Admin notice update failed:", error);
    const message = error instanceof Error ? error.message : "Erro ao atualizar aviso.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await deleteSiteNotice(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin notice delete failed:", error);
    return NextResponse.json({ error: "Erro ao excluir aviso." }, { status: 500 });
  }
}
