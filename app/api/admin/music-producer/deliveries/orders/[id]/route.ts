import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../../../lib/admin-auth";
import {
  clearDeliveryRedoRequest,
  deleteMusicProducerDelivery,
  serializeMusicProducerDelivery,
  updateMusicProducerDelivery,
  type UpdateMusicProducerDeliveryInput,
} from "../../../../../../lib/music-producer-deliveries";

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

  let body: UpdateMusicProducerDeliveryInput & { clearRedo?: boolean } = {};
  try {
    body = (await request.json()) as UpdateMusicProducerDeliveryInput & { clearRedo?: boolean };
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const { clearRedo, ...updateInput } = body;
    let delivery = await updateMusicProducerDelivery(id, updateInput);
    if (!delivery) {
      return NextResponse.json({ error: "Entrega não encontrada." }, { status: 404 });
    }

    if (clearRedo) {
      delivery = await clearDeliveryRedoRequest(id);
    }

    return NextResponse.json({
      ok: true,
      delivery: serializeMusicProducerDelivery(delivery),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar entrega.";
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
    await deleteMusicProducerDelivery(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Entrega não encontrada." }, { status: 404 });
  }
}
