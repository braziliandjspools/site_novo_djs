import { Resend } from "resend";
import { SITE_NAME } from "../branding";
import { SITE_URL } from "../seo";
import { planDisplayName } from "./types";

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

export async function sendHotmartAccessGrantedEmail(input: {
  to: string;
  name: string;
  planId: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[Hotmart] email pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const planName = planDisplayName(input.planId);
  const firstName = input.name.trim().split(/\s+/)[0] || "DJ";
  const accountUrl = `${SITE_URL}/portal?view=account`;

  const subject = `Seu acesso à ${SITE_NAME} foi liberado`;
  const text = [
    `Olá, ${firstName}.`,
    "",
    "Recebemos a confirmação da sua assinatura.",
    "",
    `Seu acesso ao ${planName} já está disponível.`,
    "",
    "Acesse sua conta para começar a utilizar a plataforma.",
    accountUrl,
    "",
    SITE_NAME + ".",
  ].join("\n");

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.to,
      subject,
      text,
    });
    console.info("[Hotmart] email de ativação enviado");
    return { sent: true as const };
  } catch (error) {
    console.error("[Hotmart] falha ao enviar email de ativação");
    return { sent: false as const, reason: "send_failed" as const, error };
  }
}

export async function sendHotmartPendingAccountEmail(input: {
  to: string;
  name: string;
  planId: string;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.info("[Hotmart] email pendente pulado (RESEND_API_KEY ausente)");
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const planName = planDisplayName(input.planId);
  const firstName = input.name.trim().split(/\s+/)[0] || "DJ";
  const registerUrl = `${SITE_URL}/musicas/entrar?return=/plans`;

  const subject = `Finalize seu acesso — ${SITE_NAME}`;
  const text = [
    `Olá, ${firstName}.`,
    "",
    `Recebemos a confirmação do pagamento do ${planName}.`,
    "",
    "Para liberar o acesso na plataforma, crie sua conta usando este mesmo e-mail:",
    registerUrl,
    "",
    "Não enviamos senha por e-mail. Você define a senha no cadastro.",
    "",
    SITE_NAME + ".",
  ].join("\n");

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: input.to,
      subject,
      text,
    });
    return { sent: true as const };
  } catch {
    console.error("[Hotmart] falha ao enviar email de conta pendente");
    return { sent: false as const, reason: "send_failed" as const };
  }
}
