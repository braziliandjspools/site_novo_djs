/**
 * Download do Allavsoft (portal /portal/allavsoft).
 * Padrão: instalador hospedado no Cloudflare R2 da BRS. Sobrescreva com ALLAVSOFT_DOWNLOAD_URL /
 * NEXT_PUBLIC_ALLAVSOFT_DOWNLOAD_URL se necessário.
 */
export const ALLAVSOFT_INSTALLER_VERSION = "3.29.6.9765";
export const ALLAVSOFT_UPDATED_AT = "04/10/2026";
export const ALLAVSOFT_DOWNLOAD_URL_DEFAULT = "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/allavsoft.exe";

export function getAllavsoftDownloadUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_ALLAVSOFT_DOWNLOAD_URL?.trim() ||
    process.env.ALLAVSOFT_DOWNLOAD_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return ALLAVSOFT_DOWNLOAD_URL_DEFAULT;
}
