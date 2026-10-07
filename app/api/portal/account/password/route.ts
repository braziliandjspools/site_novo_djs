import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { prisma } from "../../../../lib/prisma";
import { getResendClient, getResendFromEmail, escapeEmailHtml } from "../../../../lib/resend-client";
import { SITE_PRODUCTION_URL } from "../../../../lib/branding";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) {
      return NextResponse.json({ error: "A nova senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json({ error: "O envio de confirmação por e-mail não está configurado." }, { status: 503 });
    }

    await prisma.passwordResetToken.deleteMany({ where: { portalUserId: user.id, usedAt: null } });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const newPasswordHash = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { portalUserId: user.id, tokenHash, newPasswordHash, expiresAt },
    });

    const base = (process.env.SITE_URL || SITE_PRODUCTION_URL).replace(/\/$/, "");
    const link = `${base}/api/portal/account/password/confirm?token=${encodeURIComponent(rawToken)}`;
    const safeName = escapeEmailHtml(user.name);

    await resend.emails.send({
      from: getResendFromEmail(),
      to: user.email,
      subject: "Confirme a alteração da sua senha — Brazilian Remix Service",
      html: `<div style="font-family:Arial,sans-serif;background:#111;color:#fff;padding:32px;line-height:1.6">
        <h2>Confirme sua nova senha</h2>
        <p>Olá, <strong>${safeName}</strong>.</p>
        <p>Recebemos uma solicitação para alterar a senha da sua conta BRS.</p>
        <p><a href="${link}" style="display:inline-block;background:#00ff9d;color:#000;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Confirmar alteração de senha</a></p>
        <p style="color:#999;font-size:13px">O link expira em 30 minutos. Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>`,
    });

    return NextResponse.json({ ok: true, message: "Enviamos um link de confirmação para seu e-mail." });
  } catch (error) {
    console.error("[portal-account-password]", error);
    return NextResponse.json({ error: "Não foi possível iniciar a alteração de senha." }, { status: 500 });
  }
}
