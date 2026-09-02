import { NextResponse } from "next/server";
import {
  createPortalToken,
  PORTAL_COOKIE,
  PORTAL_DESKTOP_CLIENT_HEADER,
  PORTAL_DESKTOP_CLIENT_ID,
  portalCookieOptions,
} from "../../../lib/portal";
import { handleDownloaderCorsPreflight, withDownloaderCors } from "../../../lib/downloader-cors";
import { verifyUserPassword } from "../../../lib/portal-users";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim() ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  let user;
  try {
    user = await verifyUserPassword(email, password);
  } catch (err) {
    console.error("[portal/login] verifyUserPassword failed:", err);
    const message =
      err instanceof Error && err.message.includes("portal_users")
        ? "Banco de dados do portal ainda não foi inicializado. Tente novamente em alguns minutos."
        : "Serviço temporariamente indisponível. Tente novamente.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  if (!user) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  if (!user.active) {
    return NextResponse.json(
      { error: "Seu acesso está inativo. Entre em contato com o suporte." },
      { status: 403 },
    );
  }

  const token = createPortalToken(user.id);
  const isDesktopClient = request.headers.get(PORTAL_DESKTOP_CLIENT_HEADER) === PORTAL_DESKTOP_CLIENT_ID;

  const response = NextResponse.json(
    isDesktopClient
      ? { ok: true, token, expiresIn: 60 * 60 * 24 * 7 }
      : { ok: true },
  );
  response.cookies.set(PORTAL_COOKIE, token, portalCookieOptions());
  return withDownloaderCors(request, response);
}
