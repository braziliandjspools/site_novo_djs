import { DEFAULT_BP_SITE_URL } from "./api/config";

export const SITE_NAME = "Brazilian Remix Service";
export const SITE_SHORT = "BRS";
export const DOWNLOADER_NAME = "BRS Downloader";
export const BRS_LOGO_SRC = "/images/brs-logo.jpg";

/** URL da plataforma de músicas no site (configurável via .env). */
export const BP_MUSICAS_URL = DEFAULT_BP_SITE_URL;

/** @deprecated Use DOWNLOADER_NAME */
export const APP_NAME = DOWNLOADER_NAME;
