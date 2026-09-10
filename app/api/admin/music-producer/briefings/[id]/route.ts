import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../../lib/admin-auth";
import {
  getMusicProducerBriefingById,
  isBriefingStatus,
  returnBriefingToClient,
  softDeleteMusicProducerBriefing,
  updateMusicProducerBriefing,
} from "../../../../../lib/music-producer-briefings";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
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

  let body: {
    status?: string;
    adminNote?: string | null;
    returnToClient?: boolean;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const existing = await getMusicProducerBriefingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    if (body.returnToClient) {
      const briefing = await returnBriefingToClient(id, body.adminNote ?? undefined);
      return NextResponse.json({ ok: true, briefing });
    }

    if (body.status !== undefined && !isBriefingStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const briefing = await updateMusicProducerBriefing(id, {
      status: body.status,
      adminNote: body.adminNote,
    });
    return NextResponse.json({ ok: true, briefing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pedido.";
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
    const existing = await getMusicProducerBriefingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }
    const briefing = await softDeleteMusicProducerBriefing(id);
    return NextResponse.json({ ok: true, briefing });
  } catch {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
}
