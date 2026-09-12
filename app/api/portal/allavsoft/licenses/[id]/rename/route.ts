import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../../../lib/portal";
import {
  AllavsoftLicenseError,
  regenerateLicenseName,
} from "../../../../../../lib/allavsoft-licenses";
import { userHasAllavsoft } from "../../../../../../lib/portal-users";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!userHasAllavsoft(user)) {
    return NextResponse.json({ error: "Seu plano não inclui Allavsoft." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const license = await regenerateLicenseName(user.id, id.trim());
    return NextResponse.json({ ok: true, license });
  } catch (error) {
    if (error instanceof AllavsoftLicenseError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "REGEN_LIMIT"
            ? 409
            : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : "Erro ao regenerar nome.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
