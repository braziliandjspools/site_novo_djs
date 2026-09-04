import { NextResponse } from "next/server";
import type { SiteNoticeAudience, SiteNoticeSeverity } from "@prisma/client";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import { createSiteNotice, listSiteNoticesForAdmin } from "../../../lib/site-notices";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function parseSeverity(value: unknown): SiteNoticeSeverity | null {
  if (value === "INFO" || value === "SUCCESS" || value === "WARNING" || value === "ERROR") {
    return value;
  }
  return null;
}

function parseAudience(value: unknown): SiteNoticeAudience | null {
  if (value === "GLOBAL" || value === "USER") return value;
  return null;
}

function parseOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export async function GET(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  try {
    const notices = await listSiteNoticesForAdmin();
    return NextResponse.json({ notices });
  } catch (error) {
    console.error("Admin notices list failed:", error);
    return NextResponse.json({ error: "Erro ao carregar avisos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const noticeBody = typeof body.body === "string" ? body.body.trim() : "";
  const audience = parseAudience(body.audience);
  const severity = body.severity === undefined ? "INFO" : parseSeverity(body.severity);
  const portalUserId =
    body.portalUserId === null || body.portalUserId === undefined || body.portalUserId === ""
      ? null
      : Number(body.portalUserId);
  const startsAt = parseOptionalDate(body.startsAt);
  const endsAt = parseOptionalDate(body.endsAt);

  if (!title || !noticeBody || !audience || !severity) {
    return NextResponse.json(
      { error: "Campos obrigatórios: title, body, audience, severity." },
      { status: 400 },
    );
  }

  if (audience === "USER" && (!portalUserId || !Number.isFinite(portalUserId))) {
    return NextResponse.json({ error: "Selecione o usuário do aviso." }, { status: 400 });
  }

  if (startsAt === undefined || endsAt === undefined) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  try {
    const notice = await createSiteNotice({
      title,
      body: noticeBody,
      audience,
      severity,
      portalUserId,
      startsAt,
      endsAt,
      active: body.active === undefined ? true : Boolean(body.active),
    });
    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error("Admin notice create failed:", error);
    const message = error instanceof Error ? error.message : "Erro ao criar aviso.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
