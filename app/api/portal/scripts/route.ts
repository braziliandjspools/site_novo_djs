import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getAuthenticatedPortalUser } from "../../../lib/portal";
import { userHasSubscriptionPlan } from "../../../lib/portal-users";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login no portal." }, { status: 401, headers: privateHeaders });
  }
  if (!userHasSubscriptionPlan(user)) {
    return NextResponse.json({ error: "Os scripts estão disponíveis para clientes com plano ativo." }, {
      status: 403,
      headers: privateHeaders,
    });
  }

  try {
    const scripts = await prisma.portalAdminScript.findMany({
      where: { active: true },
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        language: true,
        script: true,
      },
    });

    return NextResponse.json({ scripts }, { headers: privateHeaders });
  } catch (error) {
    console.error("Portal scripts list failed:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os scripts agora." },
      { status: 500, headers: privateHeaders },
    );
  }
}
