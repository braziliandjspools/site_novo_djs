import "server-only";

import bcrypt from "bcryptjs";
import { SITE_NAME } from "./branding";
import {
  hashResetToken,
  isPlausibleResetToken,
  generateResetToken,
  passwordResetError,
  passwordResetExpiresAt,
} from "./password-reset-token";
import { prisma } from "./prisma";
import { escapeEmailHtml, getResendClient, getResendFromEmail } from "./resend-client";
import { SITE_URL } from "./seo";

const GENERIC_SENT =
  "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele vale por 1 hora.";

const INVALID_LINK = "Este link expirou ou já foi usado. Peça um novo.";

export function passwordResetRequestMessage() {
  return GENERIC_SENT;
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const resend = getResendClient();
  if (!resend) {
    console.error("[password-reset] RESEND_API_KEY ausente");
    return {
      ok: false as const,
      status: 503,
      error: "O envio de e-mail está indisponível no momento. Tente novamente mais tarde.",
    };
  }

  const user = await prisma.portalUser.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { ok: true as const, message: GENERIC_SENT };

  const token = generateResetToken();
  const expiresAt = passwordResetExpiresAt();
  const created = await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { portalUserId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return tx.passwordResetToken.create({
      data: {
        portalUserId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt,
      },
    });
  });

  const resetUrl = `${SITE_URL}/musicas/entrar?modo=redefinir&token=${encodeURIComponent(token)}`;
  const firstName = user.name.trim().split(/\s+/)[0] || "DJ";

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: [user.email],
      subject: `Redefina sua senha — ${SITE_NAME}`,
      text: [
        `Olá, ${firstName}.`,
        "",
        "Recebemos um pedido para redefinir a senha da sua conta.",
        "Abra o link abaixo para escolher uma nova senha. Ele vale por 1 hora e só pode ser usado uma vez:",
        resetUrl,
        "",
        "Se você não pediu isso, ignore este e-mail. Sua senha atual continua valendo.",
        "",
        SITE_NAME,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f4f4f5;padding:24px;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#1ed760;">${escapeEmailHtml(SITE_NAME)}</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Redefinir senha</h1>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#d4d4d8;">Olá, ${escapeEmailHtml(firstName)}.</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#d4d4d8;">
            Recebemos um pedido para redefinir a senha da sua conta. O link vale por 1 hora e só pode ser usado uma vez.
          </p>
          <a href="${escapeEmailHtml(resetUrl)}" style="display:inline-block;background:#1db954;color:#000;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;">Criar nova senha</a>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#a1a1aa;">
            Se você não pediu isso, ignore este e-mail. Sua senha atual continua valendo.
          </p>
        </div>`,
    });
  } catch (err) {
    console.error("[password-reset] envio falhou:", err);
    await prisma.passwordResetToken.delete({ where: { id: created.id } }).catch(() => undefined);
    return {
      ok: false as const,
      status: 503,
      error: "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.",
    };
  }

  return { ok: true as const, message: GENERIC_SENT };
}

export async function confirmPasswordReset(token: string, password: string) {
  const passwordError = passwordResetError(password);
  if (passwordError) return { ok: false as const, status: 400, error: passwordError };
  if (!isPlausibleResetToken(token)) {
    return { ok: false as const, status: 400, error: "Este link é inválido. Peça um novo." };
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          tokenHash: hashResetToken(token),
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) {
        throw new Error("RESET_TOKEN_USED");
      }

      const record = await tx.passwordResetToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: { portalUserId: true },
      });
      if (!record) throw new Error("RESET_TOKEN_USED");

      await tx.portalUser.update({
        where: { id: record.portalUserId },
        data: { passwordHash },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "RESET_TOKEN_USED") {
      return { ok: false as const, status: 400, error: INVALID_LINK };
    }
    console.error("[password-reset] falha ao gravar senha:", err);
    return {
      ok: false as const,
      status: 503,
      error: "Não foi possível salvar a nova senha. Tente novamente.",
    };
  }

  return { ok: true as const };
}
