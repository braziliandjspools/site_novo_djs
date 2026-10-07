import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { prisma } from "../../../../lib/prisma";
import { getResendClient, getResendFromEmail, escapeEmailHtml } from "../../../../lib/resend-client";
import { BRS_LOGO_SRC, SITE_NAME } from "../../../../lib/branding";
import { getPortalSiteBaseUrl } from "../../../../lib/portal-site-url";

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

    const base = getPortalSiteBaseUrl();
    const link = `${base}/api/portal/account/password/confirm?token=${encodeURIComponent(rawToken)}`;
    const logo = `${base}${BRS_LOGO_SRC}`;
    const safeName = escapeEmailHtml(user.name);

    await resend.emails.send({
      from: getResendFromEmail(),
      to: user.email,
      subject: `Confirme a alteração da sua senha | ${SITE_NAME}`,
      text: `Olá, ${user.name}.\n\nRecebemos uma solicitação para alterar a senha da sua conta ${SITE_NAME}. Para confirmar e salvar a nova senha, acesse: ${link}\n\nEste link expira em 30 minutos. Se você não solicitou a alteração, ignore este e-mail.`,
      html: `<div style="margin:0;padding:32px 12px;background:#080b0d;font-family:Arial,Helvetica,sans-serif;color:#f7fafc">
        <div style="max-width:560px;margin:0 auto;border:1px solid #20272c;border-radius:18px;overflow:hidden;background:#101518">
          <div style="padding:24px 28px;background:#050708;text-align:center;border-bottom:1px solid #20272c">
            <img src="${logo}" width="280" alt="Brazilian Remix Service" style="display:block;width:100%;max-width:280px;height:auto;margin:0 auto;border:0" />
          </div>
          <div style="padding:32px 30px 28px">
            <div style="margin-bottom:14px;color:#a3ff12;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Segurança da conta</div>
            <h1 style="margin:0 0 16px;color:#fff;font-size:25px;line-height:1.25">Confirme sua nova senha</h1>
            <p style="margin:0 0 12px;color:#d8e0e4;font-size:15px;line-height:1.7">Olá, <strong style="color:#fff">${safeName}</strong>.</p>
            <p style="margin:0 0 24px;color:#b5c0c6;font-size:15px;line-height:1.7">Recebemos uma solicitação para alterar a senha da sua conta BRS. Confirme abaixo para salvar a nova senha.</p>
            <div style="text-align:center;margin:0 0 24px">
              <a href="${link}" style="display:inline-block;padding:14px 22px;border-radius:9px;background:#a3ff12;color:#071000;font-size:14px;font-weight:700;text-decoration:none">Confirmar nova senha</a>
            </div>
            <p style="margin:0 0 8px;color:#8e9ba2;font-size:12px;line-height:1.6">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
            <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6"><a href="${link}" style="color:#a3ff12;text-decoration:underline">${link}</a></p>
            <div style="height:1px;margin:24px 0;background:#263037"></div>
            <p style="margin:0;color:#8e9ba2;font-size:12px;line-height:1.7">Este link expira em <strong style="color:#cbd5da">30 minutos</strong> e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore este e-mail; sua senha atual continuará ativa.</p>
          </div>
          <div style="padding:16px 28px;border-top:1px solid #20272c;color:#718087;font-size:11px;line-height:1.6;text-align:center">${SITE_NAME} · Mensagem automática de segurança</div>
        </div>
      </div>`,
    });

    return NextResponse.json({ ok: true, message: "Enviamos um link de confirmação para seu e-mail." });
  } catch (error) {
    console.error("[portal-account-password]", error);
    return NextResponse.json({ error: "Não foi possível iniciar a alteração de senha." }, { status: 500 });
  }
}
