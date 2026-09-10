import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../../lib/portal";
import {
  getMusicProducerBriefingById,
  updateMusicProducerBriefing,
} from "../../../../../lib/music-producer-briefings";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Cliente corrige e reenvia pedido em edição → volta para Pendente. */
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
  if (existing.status !== "EM_EDICAO") {
    return NextResponse.json(
      { error: "Só é possível editar pedidos com status Em edição." },
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
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const idea = body.idea?.trim();
  if (!idea) {
    return NextResponse.json({ error: "Descreva a ideia da música." }, { status: 400 });
  }

  try {
    const briefing = await updateMusicProducerBriefing(id, {
      idea,
      lyrics: body.lyrics,
      style: body.style,
      occasion: body.occasion,
      deadline: body.deadline,
      additionalNotes: body.additionalNotes,
      status: "PENDENTE",
      adminNote: null,
    });
    return NextResponse.json({ ok: true, briefing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar pedido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
