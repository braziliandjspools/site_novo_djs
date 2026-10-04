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

let ensuringTable: Promise<void> | null = null;

/** Cria a tabela se o deploy não rodou a migration (db push é pulado em host interno). */
function ensurePasswordResetTable() {
  if (!ensuringTable) {
    ensuringTable = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
          "id" TEXT NOT NULL,
          "portal_user_id" INTEGER NOT NULL,
          "token_hash" TEXT NOT NULL,
          "expires_at" TIMESTAMP(3) NOT NULL,
          "used_at" TIMESTAMP(3),
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key"
        ON "password_reset_tokens"("token_hash")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "password_reset_tokens_portal_user_id_created_at_idx"
        ON "password_reset_tokens"("portal_user_id", "created_at")
      `);
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "password_reset_tokens"
          ADD CONSTRAINT "password_reset_tokens_portal_user_id_fkey"
          FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (!/already exists|duplicate/i.test(message)) throw err;
      }
    })().catch((err) => {
      ensuringTable = null;
      throw err;
    });
  }
  return ensuringTable;
}

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

  await ensurePasswordResetTable();

  const token = generateResetToken();
  const expiresAt = passwordResetExpiresAt();
  await prisma.passwordResetToken.updateMany({
    where: { portalUserId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  const created = await prisma.passwordResetToken.create({
    data: {
      portalUserId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt,
    },
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
  const tokenHash = hashResetToken(token);
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await ensurePasswordResetTable();
    const consumed = await prisma.passwordResetToken.updateMany({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      return { ok: false as const, status: 400, error: INVALID_LINK };
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { portalUserId: true },
    });
    if (!record) {
      return { ok: false as const, status: 400, error: INVALID_LINK };
    }

    await prisma.portalUser.update({
      where: { id: record.portalUserId },
      data: { passwordHash },
    });
  } catch (err) {
    console.error("[password-reset] falha ao gravar senha:", err);
    await prisma.passwordResetToken
      .updateMany({ where: { tokenHash, usedAt: now }, data: { usedAt: null } })
      .catch(() => undefined);
    return {
      ok: false as const,
      status: 503,
      error: "Não foi possível salvar a nova senha. Tente novamente.",
    };
  }

  return { ok: true as const };
}
