import { DEFAULT_API_BASE_URL, DEFAULT_BP_SITE_URL } from "./api/config";

export const SITE_NAME = "Brazilian Remix Service";
export const SITE_SHORT = "BRS";
export const DOWNLOADER_NAME = "BRS Downloader";
export const BRS_LOGO_SRC = "/images/brs-logo.jpg";

/** URL da plataforma de músicas no site (configurável via .env). */
export const BP_MUSICAS_URL = DEFAULT_BP_SITE_URL;

/** Política de Privacidade do Downloader (abre no navegador padrão). */
export const BP_PRIVACY_DOWNLOADER_URL = (() => {
  try {
    return `${new URL(DEFAULT_API_BASE_URL).origin}/privacy/downloader`;
  } catch {
    return `${DEFAULT_API_BASE_URL.replace(/\/+$/, "")}/privacy/downloader`;
  }
})();

/** @deprecated Use DOWNLOADER_NAME */
export const APP_NAME = DOWNLOADER_NAME;
