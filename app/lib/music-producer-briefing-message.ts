import { whatsappUrl } from "./site";

export type MusicProducerBriefingPayload = {
  name: string;
  email: string;
  whatsapp: string;
  servicePlan: string;
  estimatedQuote: string;
  deadline: string;
  deadlineSurcharge: string;
  idea: string;
  lyrics: string;
  style: string;
  occasion: string;
  message: string;
};

export function validateMusicProducerBriefing(payload: MusicProducerBriefingPayload): string | null {
  if (!payload.servicePlan || (!payload.idea && !payload.message)) {
    return "Preencha o tipo de produção e a ideia do projeto.";
  }

  return null;
}

export function validateMusicProducerBriefingContact(payload: MusicProducerBriefingPayload): string | null {
  if (
    !payload.name ||
    !payload.email ||
    !payload.whatsapp ||
    !payload.servicePlan ||
    (!payload.idea && !payload.message)
  ) {
    return "Preencha nome, e-mail, WhatsApp, tipo de produção e a ideia do projeto.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Informe um e-mail válido.";
  }

  return null;
}

function appendField(lines: string[], label: string, value: string) {
  if (value.trim()) {
    lines.push(`*${label}:* ${value.trim()}`);
  }
}

const WHATSAPP_MESSAGE_MAX = 1500;

function truncateWhatsAppMessage(message: string): string {
  if (message.length <= WHATSAPP_MESSAGE_MAX) return message;

  const suffix =
    "\n\n_(parte da letra ou detalhes foram omitidos por limite do WhatsApp — complemente na conversa)_";
  return message.slice(0, WHATSAPP_MESSAGE_MAX - suffix.length) + suffix;
}

export function buildMusicProducerBriefingWhatsAppMessage(payload: MusicProducerBriefingPayload): string {
  const lines: string[] = ["Olá! Quero enviar um briefing de produção musical.", ""];

  appendField(lines, "Nome", payload.name);
  appendField(lines, "E-mail", payload.email);
  appendField(lines, "WhatsApp", payload.whatsapp);
  appendField(lines, "Tipo de produção", payload.servicePlan);
  appendField(lines, "Valor estimado", payload.estimatedQuote);
  appendField(lines, "Prazo desejado", payload.deadline);
  appendField(lines, "Acréscimo de prazo", payload.deadlineSurcharge);
  appendField(lines, "Ideia do projeto", payload.idea);
  appendField(lines, "Letra", payload.lyrics);
  appendField(lines, "Estilo", payload.style);
  appendField(lines, "Ocasião", payload.occasion);
  appendField(lines, "Observações", payload.message);

  return truncateWhatsAppMessage(lines.join("\n"));
}

export function musicProducerBriefingWhatsAppUrl(payload: MusicProducerBriefingPayload): string {
  return whatsappUrl(buildMusicProducerBriefingWhatsAppMessage(payload));
}
