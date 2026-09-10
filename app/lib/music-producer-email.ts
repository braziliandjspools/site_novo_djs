import "server-only";
import { SITE_NAME, SITE_PRODUCTION_URL } from "./branding";
import { LEGAL_CONTACT_EMAIL } from "../privacy/legal-types";
import {
  escapeEmailHtml,
  getResendClient,
  getResendFromEmail,
} from "./resend-client";
import { SITE_URL } from "./seo";

export type MusicProducerBriefingEmailInput = {
  briefingId: number;
  name: string;
  email: string;
  whatsapp: string;
  servicePlan: string;
  estimatedQuote: string;
  idea: string;
  lyrics: string;
  style: string;
  occasion: string;
  deadline: string;
  deadlineSurcharge: string;
  additionalNotes: string;
};

function getBriefingNotifyTo(): string {
  return (
    process.env.MUSIC_PRODUCER_BRIEFING_TO?.trim() ||
    process.env.MUSIC_PRODUCER_NOTIFY_EMAIL?.trim() ||
    LEGAL_CONTACT_EMAIL
  );
}

function appendTextField(lines: string[], label: string, value: string) {
  if (value.trim()) lines.push(`${label}: ${value.trim()}`);
}

function appendHtmlField(rows: string[], label: string, value: string) {
  if (!value.trim()) return;
  rows.push(
    `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);vertical-align:top;"><p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8a8a;">${escapeEmailHtml(label)}</p><p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:#f0f0f0;white-space:pre-wrap;">${escapeEmailHtml(value.trim())}</p></td></tr>`,
  );
}

/**
 * Notifica a equipe (Gmail) quando um briefing é enviado em /musicproducer.
 * Não bloqueia o fluxo do cliente se o Resend falhar.
 */
export async function sendMusicProducerBriefingNotification(
  input: MusicProducerBriefingEmailInput,
) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[music-producer/email] pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const to = getBriefingNotifyTo();
  if (!to) {
    console.info("[music-producer/email] pulado (destinatário ausente)");
    return { sent: false as const, reason: "missing_to" as const };
  }

  const adminUrl = `${SITE_URL || SITE_PRODUCTION_URL}/admin`;
  const subject = `[Music Producer] Novo briefing #${input.briefingId} — ${input.servicePlan}`;

  const textLines = [
    `Novo briefing de produção musical (#${input.briefingId})`,
    "",
  ];
  appendTextField(textLines, "Nome", input.name);
  appendTextField(textLines, "E-mail", input.email);
  appendTextField(textLines, "WhatsApp", input.whatsapp);
  appendTextField(textLines, "Plano", input.servicePlan);
  appendTextField(textLines, "Valor estimado", input.estimatedQuote);
  appendTextField(textLines, "Prazo", input.deadline);
  appendTextField(textLines, "Acréscimo de prazo", input.deadlineSurcharge);
  appendTextField(textLines, "Ideia", input.idea);
  appendTextField(textLines, "Letra", input.lyrics);
  appendTextField(textLines, "Estilo", input.style);
  appendTextField(textLines, "Ocasião", input.occasion);
  appendTextField(textLines, "Observações", input.additionalNotes);
  textLines.push("", `Admin: ${adminUrl}`, "", SITE_NAME);
  const text = textLines.join("\n");

  const htmlRows: string[] = [];
  appendHtmlField(htmlRows, "Nome", input.name);
  appendHtmlField(htmlRows, "E-mail", input.email);
  appendHtmlField(htmlRows, "WhatsApp", input.whatsapp);
  appendHtmlField(htmlRows, "Plano", input.servicePlan);
  appendHtmlField(htmlRows, "Valor estimado", input.estimatedQuote);
  appendHtmlField(htmlRows, "Prazo", input.deadline);
  appendHtmlField(htmlRows, "Acréscimo de prazo", input.deadlineSurcharge);
  appendHtmlField(htmlRows, "Ideia", input.idea);
  appendHtmlField(htmlRows, "Letra", input.lyrics);
  appendHtmlField(htmlRows, "Estilo", input.style);
  appendHtmlField(htmlRows, "Ocasião", input.occasion);
  appendHtmlField(htmlRows, "Observações", input.additionalNotes);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0b0b;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#151515;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px 24px 12px;background:linear-gradient(180deg,rgba(255,85,0,0.22),transparent);">
            <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#ff5500;font-weight:700;">Music Producer</p>
            <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;color:#fff;">Novo briefing #${input.briefingId}</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#c7c7c7;">${escapeEmailHtml(input.servicePlan)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${htmlRows.join("")}</table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:4px 24px 28px;">
            <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(180deg,#00B347,#009739);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:12px;">Abrir admin</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: getResendFromEmail(),
      to,
      replyTo: input.email.trim() || undefined,
      subject,
      text,
      html,
    });

    if (result.error) {
      console.error("[music-producer/email] Resend error:", result.error.message);
      return { sent: false as const, reason: "send_failed" as const };
    }

    console.info("[music-producer/email] briefing notificado", { briefingId: input.briefingId, to });
    return { sent: true as const };
  } catch (err) {
    console.error("[music-producer/email] falha ao enviar:", err);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
