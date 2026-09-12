import "server-only";
import { SITE_NAME, SITE_PRODUCTION_URL } from "./branding";
import { LEGAL_CONTACT_EMAIL } from "../privacy/legal-types";
import {
  escapeEmailHtml,
  getResendClient,
  getResendFromEmail,
} from "./resend-client";
import { SITE_URL } from "./seo";

/** Destino fixo do admin (Resend). Env só sobrescreve se definido. */
function getAllavsoftNotifyTo(): string {
  return (
    process.env.ALLAVSOFT_NOTIFY_EMAIL?.trim() ||
    process.env.MUSIC_PRODUCER_BRIEFING_TO?.trim() ||
    LEGAL_CONTACT_EMAIL // brazilianremixservice@gmail.com
  );
}

/** Alerta admin: restam poucas keys no pool. */
export async function sendAllavsoftPoolLowAlert(input: {
  availableCount: number;
  totalAssigned: number;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[allavsoft/email] pool-low pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const to = getAllavsoftNotifyTo();
  if (!to) {
    console.info("[allavsoft/email] pool-low pulado (destinatário ausente)");
    return { sent: false as const, reason: "missing_to" as const };
  }

  const adminUrl = `${SITE_URL || SITE_PRODUCTION_URL}/admin`;
  const subject = `[Allavsoft] Pool baixo — restam ${input.availableCount} keys`;

  const text = [
    `Alerta de estoque Allavsoft`,
    "",
    `Keys livres no pool: ${input.availableCount}`,
    `Keys já atribuídas: ${input.totalAssigned}`,
    "",
    "Alimente o sistema com novos seriais o quanto antes.",
    `Admin: ${adminUrl}`,
    "",
    SITE_NAME,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f0f0f0;padding:24px;">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#FFDF00;">Allavsoft</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Pool de seriais baixo</h1>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#b3b3b3;">
      Restam <strong style="color:#FFDF00;">${input.availableCount}</strong> keys livres no pool
      (${input.totalAssigned} já atribuídas).
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#b3b3b3;">
      Alimente o sistema com novos seriais para continuar liberando licenças aos clientes.
    </p>
    <a href="${escapeEmailHtml(adminUrl)}" style="display:inline-block;background:#1DB954;color:#000;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;">Abrir admin</a>
  </div>`;

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: [to],
      subject,
      text,
      html,
    });
    console.info("[allavsoft/email] pool-low enviado", { to, available: input.availableCount });
    return { sent: true as const };
  } catch (err) {
    console.error("[allavsoft/email] pool-low falhou:", err);
    return { sent: false as const, reason: "send_failed" as const };
  }
}

/** Cliente avisa que nenhum dos seriais ativou no Allavsoft. */
export async function sendAllavsoftSupportAlert(input: {
  userName: string;
  userEmail: string;
  userWhatsapp: string;
  licenses: Array<{ licenseName: string; serial: string; issuedAt: string; copiedAt: string | null }>;
  note?: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[allavsoft/email] support pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const to = getAllavsoftNotifyTo();
  if (!to) {
    console.info("[allavsoft/email] support pulado (destinatário ausente)");
    return { sent: false as const, reason: "missing_to" as const };
  }

  const adminUrl = `${SITE_URL || SITE_PRODUCTION_URL}/admin`;
  const subject = `[Allavsoft] Serial não ativou — ${input.userName}`;

  const licenseLines = input.licenses.map(
    (l, i) =>
      `${i + 1}. ${l.licenseName} | ${l.serial} | gerado ${l.issuedAt}${l.copiedAt ? ` | copiado ${l.copiedAt}` : ""}`,
  );

  const text = [
    "Cliente reportou que nenhum dos seriais Allavsoft ativou.",
    "",
    `Nome: ${input.userName}`,
    `E-mail: ${input.userEmail}`,
    `WhatsApp: ${input.userWhatsapp}`,
    "",
    "Seriais da conta:",
    ...licenseLines,
    "",
    input.note?.trim() ? `Observação: ${input.note.trim()}` : "",
    `Admin: ${adminUrl}`,
    "",
    SITE_NAME,
  ]
    .filter(Boolean)
    .join("\n");

  const licenseHtml = input.licenses
    .map(
      (l) =>
        `<li style="margin:0 0 8px;"><code style="color:#FFDF00;">${escapeEmailHtml(l.licenseName)}</code> — <code style="color:#fff;">${escapeEmailHtml(l.serial)}</code></li>`,
    )
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f0f0f0;padding:24px;">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#FFDF00;">Allavsoft · Suporte</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Serial não ativou</h1>
    <p style="margin:0 0 8px;font-size:14px;"><strong>${escapeEmailHtml(input.userName)}</strong></p>
    <p style="margin:0 0 4px;font-size:13px;color:#b3b3b3;">${escapeEmailHtml(input.userEmail)}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#b3b3b3;">WhatsApp: ${escapeEmailHtml(input.userWhatsapp)}</p>
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8a8a;">Seriais</p>
    <ul style="margin:0 0 16px;padding-left:18px;">${licenseHtml}</ul>
    ${
      input.note?.trim()
        ? `<p style="margin:0 0 16px;font-size:14px;color:#b3b3b3;"><strong>Observação:</strong> ${escapeEmailHtml(input.note.trim())}</p>`
        : ""
    }
    <a href="${escapeEmailHtml(adminUrl)}" style="display:inline-block;background:#1DB954;color:#000;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;">Abrir admin</a>
  </div>`;

  try {
    await resend.emails.send({
      from: getResendFromEmail(),
      to: [to],
      subject,
      text,
      html,
    });
    console.info("[allavsoft/email] support enviado", { to, email: input.userEmail });
    return { sent: true as const };
  } catch (err) {
    console.error("[allavsoft/email] support falhou:", err);
    return { sent: false as const, reason: "send_failed" as const };
  }
}
