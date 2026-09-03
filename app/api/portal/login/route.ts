import { NextResponse } from "next/server";
import {
  createPortalToken,
  PORTAL_COOKIE,
  portalCookieOptions,
} from "../../../lib/portal";
import { handleDownloaderCorsPreflight, withDownloaderCors } from "../../../lib/downloader-cors";
import { verifyUserPassword } from "../../../lib/portal-users";

function loginJson(request: Request, body: unknown, init?: ResponseInit) {
  return withDownloaderCors(request, NextResponse.json(body, init));
}

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = body.email?.trim().toLowerCase() ?? "";
    password = body.password ?? "";
  } catch {
    return loginJson(request, { error: "Requisição inválida" }, { status: 400 });
  }

  if (!email || !password) {
    return loginJson(request, { error: "Informe e-mail e senha." }, { status: 400 });
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
    return loginJson(request, { error: message }, { status: 503 });
  }

  if (!user) {
    return loginJson(request, { error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  if (!user.active) {
    return loginJson(
      request,
      { error: "Seu acesso está inativo. Entre em contato com o suporte." },
      { status: 403 },
    );
  }

  const token = createPortalToken(user.id);
  const response = loginJson(request, {
    ok: true,
    token,
    expiresIn: 60 * 60 * 24 * 7,
  });
  response.cookies.set(PORTAL_COOKIE, token, portalCookieOptions());
  return response;
}
