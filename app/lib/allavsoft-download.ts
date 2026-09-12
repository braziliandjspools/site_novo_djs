/**
 * Instalador Windows do Allavsoft servido pelo site (portal /allavsoft).
 * Arquivo: public/downloads/allavsoft.exe
 * (ou sobrescreva com ALLAVSOFT_DOWNLOAD_URL / NEXT_PUBLIC_ALLAVSOFT_DOWNLOAD_URL).
 */
export const ALLAVSOFT_INSTALLER_FILENAME = "allavsoft.exe";
export const ALLAVSOFT_INSTALLER_VERSION = "3.29.4";
export const ALLAVSOFT_INSTALLER_PATH = `/downloads/${ALLAVSOFT_INSTALLER_FILENAME}`;

export function getAllavsoftDownloadUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_ALLAVSOFT_DOWNLOAD_URL?.trim() ||
    process.env.ALLAVSOFT_DOWNLOAD_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return ALLAVSOFT_INSTALLER_PATH;
}
