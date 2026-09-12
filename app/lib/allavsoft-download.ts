/**
 * Download do Allavsoft (portal /portal/allavsoft).
 * Padrão: mirror Workupload. Sobrescreva com ALLAVSOFT_DOWNLOAD_URL /
 * NEXT_PUBLIC_ALLAVSOFT_DOWNLOAD_URL se necessário.
 */
export const ALLAVSOFT_INSTALLER_VERSION = "3.29.4";
export const ALLAVSOFT_DOWNLOAD_URL_DEFAULT = "https://workupload.com/file/ZtbqKQUe6BV";

export function getAllavsoftDownloadUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_ALLAVSOFT_DOWNLOAD_URL?.trim() ||
    process.env.ALLAVSOFT_DOWNLOAD_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return ALLAVSOFT_DOWNLOAD_URL_DEFAULT;
}
