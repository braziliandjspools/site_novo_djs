import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { dismissPendingPortalPayment } from "../../../../lib/portal-payments";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Usuário cancela/remove um pedido pendente do histórico. */
export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const result = await dismissPendingPortalPayment(user.id, id.trim());
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[portal/payments/dismiss]", error);
    return NextResponse.json({ error: "Erro ao remover pendente." }, { status: 500 });
  }
}
