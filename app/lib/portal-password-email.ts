import "server-only";
import { SITE_NAME, SITE_PRODUCTION_URL } from "./branding";
import {
  escapeEmailHtml,
  getResendClient,
  getResendFromEmail,
} from "./resend-client";
import { SITE_URL } from "./seo";

/** Aviso ao cliente quando o admin redefine a senha no /admin. */
export async function sendPortalPasswordChangedEmail(input: {
  to: string;
  name: string;
  newPassword: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[portal/email] senha pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const firstName = escapeEmailHtml(input.name.trim().split(/\s+/)[0] || "DJ");
  const passwordHtml = escapeEmailHtml(input.newPassword);
  const loginUrl = `${SITE_URL || SITE_PRODUCTION_URL}/portal`;
  const musicasUrl = `${SITE_URL || SITE_PRODUCTION_URL}/musicas/entrar`;
  const logoUrl = `${SITE_PRODUCTION_URL}/images/brs-logo.jpg`;
  const subject = `Nova senha da sua conta — ${SITE_NAME}`;

  const text = [
    `Olá, ${input.name.trim().split(/\s+/)[0] || "DJ"}.`,
    "",
    "A equipe da Brazilian Remix Service redefiniu a senha da sua conta.",
    "",
    `Nova senha: ${input.newPassword}`,
    "",
    `Portal: ${loginUrl}`,
    `Plataforma /musicas: ${musicasUrl}`,
    "",
    "Por segurança, recomendamos trocar a senha depois do primeiro acesso, se preferir.",
    "",
    `${SITE_NAME}.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeEmailHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0b0b;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#151515;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 12px;text-align:center;background:linear-gradient(180deg,rgba(0,151,57,0.28),transparent);">
              <img src="${logoUrl}" alt="${escapeEmailHtml(SITE_NAME)}" width="72" height="72" style="border-radius:14px;display:block;margin:0 auto 14px;" />
              <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#00B347;font-weight:700;">Senha atualizada</p>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">Olá, ${firstName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 4px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.55;color:#c7c7c7;">
                A equipe da <strong style="color:#fff;">${escapeEmailHtml(SITE_NAME)}</strong> redefiniu a senha da sua conta no portal.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101010;border:1px solid rgba(0,151,57,0.35);border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a8a8a;">Sua nova senha</p>
                    <p style="margin:0;font-size:20px;letter-spacing:0.04em;color:#1ed760;font-weight:700;font-family:Consolas,Monaco,monospace;">${passwordHtml}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 24px 28px;">
              <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(180deg,#00B347,#009739);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:12px;">
                Entrar no portal
              </a>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a8a8a;">
                Plataforma VIP: <a href="${musicasUrl}" style="color:#00B347;text-decoration:none;">/musicas/entrar</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 22px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;line-height:1.5;">
                Se você não solicitou esta alteração, fale com o suporte pelo WhatsApp do site.
                Não compartilhe esta senha.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: input.to,
      subject,
      text,
      html,
    });
    console.info("[portal/email] senha redefinida enviada");
    return { sent: true as const };
  } catch {
    console.error("[portal/email] falha ao enviar senha redefinida");
    return { sent: false as const, reason: "send_failed" as const };
  }
}
