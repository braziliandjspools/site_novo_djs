import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = (await request.json()) as { name?: unknown; whatsapp?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";

    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }
    if (whatsapp.length < 8) {
      return NextResponse.json({ error: "Informe um WhatsApp válido." }, { status: 400 });
    }

    const updated = await prisma.portalUser.update({
      where: { id: user.id },
      data: { name, whatsapp },
      select: { name: true, email: true, whatsapp: true, profileImageKey: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar seus dados." }, { status: 500 });
  }
}
