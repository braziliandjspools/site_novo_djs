import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../../lib/portal";
import {
  deletePortalUserMusicProducerBriefing,
  getMusicProducerBriefingById,
  updatePortalUserMusicProducerBriefing,
} from "../../../../../lib/music-producer-briefings";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Cliente atualiza o próprio pedido enquanto ainda está pendente ou em edição. */
export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await getMusicProducerBriefingById(id);
  if (!existing || existing.portalUserId !== user.id) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (existing.status !== "PENDENTE" && existing.status !== "EM_EDICAO") {
    return NextResponse.json(
      { error: "Este pedido não pode mais ser editado porque já entrou em produção." },
      { status: 400 },
    );
  }

  let body: {
    idea?: string;
    lyrics?: string | null;
    style?: string | null;
    occasion?: string | null;
    deadline?: string | null;
    additionalNotes?: string | null;
  } = {};
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }
    body = parsed as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (typeof body.idea !== "string") {
    return NextResponse.json({ error: "Descreva a ideia da música." }, { status: 400 });
  }
  const idea = body.idea?.trim();
  if (!idea) {
    return NextResponse.json({ error: "Descreva a ideia da música." }, { status: 400 });
  }
  const optionalFields = [
    [body.lyrics, 12000],
    [body.style, 240],
    [body.occasion, 120],
    [body.deadline, 120],
    [body.additionalNotes, 2000],
  ] as const;
  if (
    idea.length > 4000 ||
    optionalFields.some(([value, maxLength]) =>
      value !== undefined && value !== null && (typeof value !== "string" || value.length > maxLength),
    )
  ) {
    return NextResponse.json({ error: "Revise os limites de tamanho dos campos do pedido." }, { status: 400 });
  }

  try {
    const briefing = await updatePortalUserMusicProducerBriefing(id, user.id, {
      idea,
      lyrics: body.lyrics,
      style: body.style,
      occasion: body.occasion,
      deadline: body.deadline,
      additionalNotes: body.additionalNotes,
      ...(existing.status === "EM_EDICAO" ? { status: "PENDENTE" as const, adminNote: null } : {}),
    });
    if (!briefing) {
      return NextResponse.json({ error: "O pedido mudou de status e não pode mais ser editado." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, briefing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pedido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Remove o registro do pedido do Portal e da fila administrativa. */
export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const deleted = await deletePortalUserMusicProducerBriefing(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Este pedido já entrou em produção ou não está disponível para exclusão." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
