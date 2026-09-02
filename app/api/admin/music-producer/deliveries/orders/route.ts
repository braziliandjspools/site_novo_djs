import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../../lib/admin-auth";
import {
  createMusicProducerDelivery,
  serializeMusicProducerDelivery,
  type CreateMusicProducerDeliveryInput,
} from "../../../../../lib/music-producer-deliveries";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export async function POST(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }
  if (!isAuthorizedAdminRequest(request)) return unauthorized();

  let body: Partial<CreateMusicProducerDeliveryInput> = {};
  try {
    body = (await request.json()) as Partial<CreateMusicProducerDeliveryInput>;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const portalUserId = Number(body.portalUserId);
  const title = body.title?.trim() ?? "";
  const orderDate = body.orderDate?.trim() ?? "";
  const downloadUrl = body.downloadUrl?.trim() ?? "";

  if (!Number.isInteger(portalUserId) || portalUserId < 1 || !title || !orderDate || !downloadUrl) {
    return NextResponse.json(
      { error: "Informe cliente, título, data do pedido e link de download." },
      { status: 400 },
    );
  }

  try {
    const delivery = await createMusicProducerDelivery({
      portalUserId,
      title,
      servicePlan: body.servicePlan,
      chargedAmount: body.chargedAmount,
      orderDate,
      releasedAt: body.releasedAt,
      downloadUrl,
      notes: body.notes,
      visible: body.visible,
    });

    return NextResponse.json({
      ok: true,
      delivery: serializeMusicProducerDelivery(delivery),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar entrega.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
