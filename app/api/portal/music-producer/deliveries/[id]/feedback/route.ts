import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../../../lib/portal";
import {
  serializeMusicProducerDelivery,
  submitPortalDeliveryFeedback,
} from "../../../../../../lib/music-producer-deliveries";
import { parseDeliveryRedoReason } from "../../../../../../lib/music-producer-delivery-feedback";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let body: {
    rating?: number;
    review?: string;
    requestRedo?: boolean;
    redoReason?: string;
    redoNotes?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const delivery = await submitPortalDeliveryFeedback(user, id, {
      rating: body.rating,
      review: body.review,
      requestRedo: body.requestRedo,
      redoReason: parseDeliveryRedoReason(body.redoReason) ?? undefined,
      redoNotes: body.redoNotes,
    });

    return NextResponse.json({
      ok: true,
      delivery: serializeMusicProducerDelivery(delivery, true),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar feedback.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
