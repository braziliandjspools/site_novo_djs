import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../../lib/portal";
import {
  AllavsoftLicenseError,
  notifySupportLicensesFailed,
} from "../../../../../lib/allavsoft-licenses";
import { userHasAllavsoft } from "../../../../../lib/portal-users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!userHasAllavsoft(user)) {
    return NextResponse.json({ error: "Seu plano não inclui Allavsoft." }, { status: 403 });
  }

  let note: string | undefined;
  try {
    const body = (await request.json()) as { note?: unknown };
    if (typeof body.note === "string" && body.note.trim()) {
      note = body.note.trim().slice(0, 1000);
    }
  } catch {
    // body opcional
  }

  try {
    const payload = await notifySupportLicensesFailed(user.id, note);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    if (error instanceof AllavsoftLicenseError) {
      const status =
        error.code === "ALREADY_NOTIFIED" || error.code === "NO_LICENSES"
          ? 409
          : error.code === "FORBIDDEN"
            ? 403
            : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    const message = error instanceof Error ? error.message : "Erro ao avisar suporte.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
