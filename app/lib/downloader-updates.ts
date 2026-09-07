/**
 * Manifesto de release do Downloader.
 * Preferência: variáveis no Vercel **se forem >= fallback embutido**.
 * Env antigo (ex.: 0.4.0) não pode travar um release já publicado no código.
 * - DOWNLOADER_LATEST_VERSION=0.5.0_beta
 * - DOWNLOADER_DOWNLOAD_URL=https://sitenovodjs.vercel.app/downloads/BRS-Downloader_0.5.0_beta_x64-setup.exe
 * - DOWNLOADER_RELEASE_NOTES=...
 * - DOWNLOADER_RELEASE_PUBLISHED_AT=2026-09-07T14:00:00.000Z (opcional)
 */

export type DownloaderReleaseManifest = {
  version: string;
  downloadUrl: string;
  notes: string;
  publishedAt: string | null;
  platform: "windows";
};

const FALLBACK_VERSION = "0.5.0_beta";
const FALLBACK_DOWNLOAD_URL =
  "https://sitenovodjs.vercel.app/downloads/BRS-Downloader_0.5.0_beta_x64-setup.exe";
const FALLBACK_NOTES =
  "BRS Downloader 0.5.0_beta: interface em Português (Brasil), English e Español — escolha o idioma antes do login e altere em Configurações.";

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Compara versões semver simples (1.2.3). Retorna >0 se a > b. */
export function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const pb = b.replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

export function getDownloaderReleaseManifest(): DownloaderReleaseManifest | null {
  const envVersion = cleanEnv(process.env.DOWNLOADER_LATEST_VERSION);
  const envUrl = cleanEnv(process.env.DOWNLOADER_DOWNLOAD_URL);
  const envNotes = cleanEnv(process.env.DOWNLOADER_RELEASE_NOTES);
  const envPublishedAt = cleanEnv(process.env.DOWNLOADER_RELEASE_PUBLISHED_AT);

  const envIsCurrentOrNewer =
    Boolean(envVersion && envUrl) && compareSemver(envVersion!, FALLBACK_VERSION) >= 0;

  return {
    version: envIsCurrentOrNewer ? envVersion! : FALLBACK_VERSION,
    downloadUrl: envIsCurrentOrNewer ? envUrl! : FALLBACK_DOWNLOAD_URL,
    notes: envIsCurrentOrNewer ? (envNotes ?? FALLBACK_NOTES) : FALLBACK_NOTES,
    publishedAt: envIsCurrentOrNewer
      ? (envPublishedAt ?? "2026-09-07T14:00:00.000Z")
      : (envPublishedAt ?? "2026-09-07T14:00:00.000Z"),
    platform: "windows",
  };
}
