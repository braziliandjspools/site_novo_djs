import { NextResponse } from "next/server";
import {
  createPortalToken,
  PORTAL_COOKIE,
  portalCookieOptions,
} from "../../../lib/portal";
import { registerPortalUser } from "../../../lib/portal-users";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; whatsapp?: string; password?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const whatsapp = body.whatsapp?.trim() ?? "";
  const password = body.password ?? "";

  if (!name || !email || !whatsapp || !password) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail, WhatsApp e senha." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  try {
    const user = await registerPortalUser({ name, email, whatsapp, password });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(PORTAL_COOKIE, createPortalToken(user.id), portalCookieOptions());
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível criar a conta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
