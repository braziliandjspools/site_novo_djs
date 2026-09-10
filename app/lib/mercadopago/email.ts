import "server-only";
import { SITE_NAME, SITE_PRODUCTION_URL } from "../branding";
import { formatDueDate } from "../due-queue";
import { getCanonicalPlanById } from "../billing/plan-catalog";
import {
  escapeEmailHtml,
  getResendClient,
  getResendFromEmail,
} from "../resend-client";
import { SITE_URL } from "../seo";

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
  const firstName = escapeEmailHtml(input.name.trim().split(/\s+/)[0] || "DJ");
  const periodEndLabel = escapeEmailHtml(formatDueDate(input.periodEnd));
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
              <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#00B347;font-weight:700;">Pagamento confirmado</p>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">Olá, ${firstName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 4px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.55;color:#c7c7c7;">
                Seu acesso VIP à <strong style="color:#fff;">${escapeEmailHtml(SITE_NAME)}</strong> foi liberado.
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
                    <p style="margin:0 0 6px;font-size:16px;color:#ffffff;font-weight:700;">${escapeEmailHtml(planLabel)}</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#bdbdbd;">Duração: ${escapeEmailHtml(durationLabel)}</p>
                    <p style="margin:0;font-size:14px;color:#1ed760;">Válido até ${periodEndLabel}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 24px 28px;">
              <a href="${accountUrl}" style="display:inline-block;background:linear-gradient(180deg,#00B347,#009739);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:12px;">
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
      from: getResendFromEmail(),
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

export async function sendMercadoPagoRefundEmail(input: {
  to: string;
  name: string;
  planId: string;
  amountBrl: string;
  reasonTitle: string;
  reasonDetail: string;
  paymentStatus: string;
  statusDetail?: string | null;
  accessRevoked: boolean;
  accessKeptReason?: string | null;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[mercadopago/email] reembolso pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const plan = getCanonicalPlanById(input.planId);
  const planLabel = plan?.title ?? "BRS Drive VIP";
  const firstName = escapeEmailHtml(input.name.trim().split(/\s+/)[0] || "DJ");
  const reasonTitle = escapeEmailHtml(input.reasonTitle);
  const reasonDetail = escapeEmailHtml(input.reasonDetail);
  const amountParsed = Number(String(input.amountBrl).replace(",", "."));
  const amountLabel = escapeEmailHtml(
    Number.isFinite(amountParsed)
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountParsed)
      : input.amountBrl,
  );
  const statusLine = escapeEmailHtml(
    [input.paymentStatus, input.statusDetail?.trim()].filter(Boolean).join(" · "),
  );
  const accountUrl = `${SITE_URL || SITE_PRODUCTION_URL}/portal/conta`;
  const plansUrl = `${SITE_URL || SITE_PRODUCTION_URL}/plans`;
  const logoUrl = `${SITE_PRODUCTION_URL}/images/brs-logo.jpg`;

  const accessBlock = input.accessRevoked
    ? {
        label: "Acesso VIP cancelado",
        text: "O plano vinculado a este pagamento foi removido da sua conta. Você pode assinar novamente em /plans quando quiser.",
        color: "#f87171",
      }
    : {
        label: "Acesso VIP mantido",
        text:
          input.accessKeptReason?.trim() ||
          "Você ainda tem cobertura ativa por outro plano ou assinatura. Só este pedido foi estornado.",
        color: "#1ed760",
      };

  const subject = `${input.reasonTitle} — ${SITE_NAME}`;

  const text = [
    `Olá, ${input.name.trim().split(/\s+/)[0] || "DJ"}.`,
    "",
    input.reasonTitle,
    input.reasonDetail,
    "",
    `Plano: ${planLabel}`,
    `Valor: ${amountLabel}`,
    `Status Mercado Pago: ${[input.paymentStatus, input.statusDetail?.trim()].filter(Boolean).join(" · ")}`,
    "",
    `${accessBlock.label}: ${accessBlock.text}`,
    "",
    `Conta: ${accountUrl}`,
    `Planos: ${plansUrl}`,
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
            <td style="padding:28px 24px 12px;text-align:center;background:linear-gradient(180deg,rgba(248,113,113,0.22),transparent);">
              <img src="${logoUrl}" alt="${escapeEmailHtml(SITE_NAME)}" width="72" height="72" style="border-radius:14px;display:block;margin:0 auto 14px;" />
              <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#f87171;font-weight:700;">Atualização de pagamento</p>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;color:#ffffff;">Olá, ${firstName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 4px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${reasonTitle}</p>
              <p style="margin:10px 0 0;font-size:15px;line-height:1.55;color:#c7c7c7;">${reasonDetail}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101010;border:1px solid rgba(248,113,113,0.28);border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a8a8a;">Motivo e detalhes</p>
                    <p style="margin:0 0 6px;font-size:16px;color:#ffffff;font-weight:700;">${escapeEmailHtml(planLabel)}</p>
                    <p style="margin:0 0 6px;font-size:14px;color:#bdbdbd;">Valor estornado: <strong style="color:#fff;">${amountLabel}</strong></p>
                    <p style="margin:0;font-size:13px;color:#8a8a8a;">Status MP: ${statusLine}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101010;border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8a8a8a;">Situação do acesso</p>
                    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${accessBlock.color};">${escapeEmailHtml(accessBlock.label)}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#bdbdbd;">${escapeEmailHtml(accessBlock.text)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 24px 28px;">
              <a href="${plansUrl}" style="display:inline-block;background:linear-gradient(180deg,#00B347,#009739);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:12px;">
                Ver planos
              </a>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a8a8a;">
                Conta: <a href="${accountUrl}" style="color:#00B347;text-decoration:none;">/portal/conta</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px 22px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;line-height:1.5;">
                Este aviso é enviado automaticamente após a confirmação do estorno no Mercado Pago.
                O prazo de crédito do valor depende do banco ou carteira Pix.
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
    console.info("[mercadopago/email] reembolso enviado");
    return { sent: true as const };
  } catch {
    console.error("[mercadopago/email] falha ao enviar reembolso");
    return { sent: false as const, reason: "send_failed" as const };
  }
}
