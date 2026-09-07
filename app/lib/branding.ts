export const SITE_NAME = "Brazilian Remix Service";
export const SITE_SHORT = "BRS";
export const SITE_TAGLINE = "Pools, curadoria e remix services para DJs";
export const DOWNLOADER_NAME = "BRS Downloader";
export const BRS_LOGO_SRC = "/images/brs-logo.jpg";

/** Domínio canônico de produção (sem barra no final).
 *  Usar www: o apex redireciona 308→www na Vercel e isso remove Authorization no Downloader.
 */
export const SITE_PRODUCTION_HOST = "www.brazilianremixservice.com.br";
export const SITE_PRODUCTION_URL = `https://${SITE_PRODUCTION_HOST}`;
/** Host apex (sem www) — redireciona para o canônico. */
export const SITE_APEX_HOST = "brazilianremixservice.com.br";
