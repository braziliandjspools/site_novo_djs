import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminToken,
  verifyAdminSecret,
} from "../../../lib/admin-auth";

export async function POST(request: Request) {
  if (!process.env.PORTAL_ADMIN_SECRET) {
    return NextResponse.json({ error: "Admin não configurado no servidor." }, { status: 503 });
  }

  let secret = "";
  try {
    const body = (await request.json()) as { secret?: string };
    secret = body.secret ?? "";
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  if (!verifyAdminSecret(secret)) {
    return NextResponse.json({ error: "Senha de admin incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions());
  return response;
}
