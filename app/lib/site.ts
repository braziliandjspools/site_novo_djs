import { SITE_NAME } from "./branding";

export const PLATFORM_URL = "https://plataformavip.netlify.app/";
export const WHATSAPP_NUMBER = "5551935052274";

function parseDriveFolderId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const fromUrl = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  return fromUrl?.[1] ?? trimmed;
}

/**
 * Pasta pública do Google Drive com faixas de preview.
 * Defina GOOGLE_DRIVE_PREVIEW_FOLDER_ID no .env.local (ID ou URL completa da pasta).
 */
export const GOOGLE_DRIVE_PREVIEW_FOLDER_ID = parseDriveFolderId(
  process.env.GOOGLE_DRIVE_PREVIEW_FOLDER_ID ?? "",
);

/** Opcional: acelera listagem e streaming. Sem chave, usa leitura da pasta pública. */
export const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY ?? "";

/**
 * Pasta pública do Google Drive com demos de produção musical (/musicproducer).
 * Subpastas = categorias; cada .mp3 pode ter um .txt com a mesma base para a história.
 */
export const GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID = parseDriveFolderId(
  process.env.GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID ?? "",
);

/** Pasta de entregas finais — subpastas com nome do cliente (/portal) */
export const GOOGLE_DRIVE_MUSIC_PRODUCER_DELIVERIES_FOLDER_ID = parseDriveFolderId(
  process.env.GOOGLE_DRIVE_MUSIC_PRODUCER_DELIVERIES_FOLDER_ID ?? "1QrJYWrPFViMQRCInh_5I105fMz2vRqpS",
);

/**
 * Pasta raiz do acervo VIP (/musicas).
 * Estrutura esperada: Mês (ex. JULHO 2024) → Semana (SEMANA 01…) → Estilos → áudio.
 */
export const GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID = parseDriveFolderId(
  process.env.GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID ??
    "https://drive.google.com/drive/folders/1zg5As-CxI6qtiAhQM-mOoHseKRxcDXxH",
);

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function checkoutUrl(planName: string) {
  return whatsappUrl(`Olá! Quero assinar o plano ${planName} da ${SITE_NAME}.`);
}

export function deemixCheckoutUrl(product: "Deemix" | "Deemix Server") {
  return whatsappUrl(
    `Olá! Quero comprar acesso ao ${product} sem assinar o plano de pools do ${SITE_NAME}.`,
  );
}

export function allavsoftCheckoutUrl() {
  return whatsappUrl(
    "Olá! Quero comprar acesso ao Allavsoft sem assinar o plano de pools do Brazilian Remix Service.",
  );
}
