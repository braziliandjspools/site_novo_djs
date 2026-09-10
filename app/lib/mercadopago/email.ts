import "server-only";
import { Resend } from "resend";
import { SITE_NAME, SITE_PRODUCTION_URL } from "../branding";
import { formatDueDate } from "../due-queue";
import { getCanonicalPlanById } from "../billing/plan-catalog";
import { SITE_URL } from "../seo";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "Brazilian Remix Service <onboarding@resend.dev>"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMercadoPagoAccessGrantedEmail(input: {
  to: string;
  name: string;
  planId: string;
  periodEnd: Date;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[mercadopago/email] pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const plan = getCanonicalPlanById(input.planId);
  const planLabel = plan?.title ?? "BRS Drive VIP";
  const durationLabel = plan?.durationLabel ?? "período VIP";
  const firstName = escapeHtml(input.name.trim().split(/\s+/)[0] || "DJ");
  const periodEndLabel = escapeHtml(formatDueDate(input.periodEnd));
  const accountUrl = `${SITE_URL || SITE_PRODUCTION_URL}/portal/conta`;
  const plansUrl = `${SITE_URL || SITE_PRODUCTION_URL}/plans`;
  const logoUrl = `${SITE_PRODUCTION_URL}/images/brs-logo.jpg`;

  const subject = `Acesso VIP liberado — ${SITE_NAME}`;

  const text = [
    `Olá, ${input.name.trim().split(/\s+/)[0] || "DJ"}.`,
    "",
    "Seu pagamento foi confirmado e o acesso VIP já está liberado.",
    "",
    `Plano: ${planLabel}`,
    `Duração: ${durationLabel}`,
    `Válido até: ${formatDueDate(input.periodEnd)}`,
    "",
    `Acesse sua conta: ${accountUrl}`,
    "",
    `${SITE_NAME}.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0b0b;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#151515;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 12px;text-align:center;background:linear-gradient(180deg,rgba(0,151,57,0.28),transparent);">
              <img src="${logoUrl}" alt="${escapeHtml(SITE_NAME)}" width="72" height="72" style="border-radius:14px;display:block;margin:0 auto 14px;" />
              <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#00B347;font-weight:700;">Pagamento confirmado</p>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">Olá, ${firstName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 4px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.55;color:#c7c7c7;">
                Seu acesso VIP à <strong style="color:#fff;">${escapeHtml(SITE_NAME)}</strong> foi liberado.
                Plataforma, packs e Downloader já estão disponíveis na sua conta.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101010;border:1px solid rgba(0,151,57,0.35);border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a8a8a;">Detalhes do plano</p>
                    <p style="margin:0 0 6px;font-size:16px;color:#ffffff;font-weight:700;">${escapeHtml(planLabel)}</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#bdbdbd;">Duração: ${escapeHtml(durationLabel)}</p>
                    <p style="margin:0;font-size:14px;color:#1ed760;">Válido até ${periodEndLabel}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 24px 28px;">
              <a href="${accountUrl}" style="display:inline-block;background:linear-gradient(180deg,#00B347,#009739);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:999px;">
                Ir para minha conta
              </a>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a8a8a;">
                Precisa renovar depois? Acesse <a href="${plansUrl}" style="color:#00B347;text-decoration:none;">/plans</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 22px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;line-height:1.5;">
                Este e-mail confirma a liberação de acesso após o webhook do Mercado Pago.
                Não inclui dados de cartão nem identificadores sensíveis de pagamento.
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
      from: getFromEmail(),
      to: input.to,
      subject,
      text,
      html,
    });
    console.info("[mercadopago/email] ativação enviada");
    return { sent: true as const };
  } catch {
    console.error("[mercadopago/email] falha ao enviar ativação");
    return { sent: false as const, reason: "send_failed" as const };
  }
}
