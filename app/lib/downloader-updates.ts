/**
 * Manifesto de release do Downloader.
 * Fonte da verdade = FALLBACK_* no código (sempre sobe no deploy).
 * Env no Vercel só sobrescreve se a versão for **estritamente maior** que o fallback.
 * - DOWNLOADER_LATEST_VERSION=1.0.5_public_beta
 * - DOWNLOADER_DOWNLOAD_URL=https://www.brazilianremixservice.com.br/downloads/BRS-Downloader_1.0.5_public_beta_x64-setup.exe
 */

export type DownloaderReleaseManifest = {
  version: string;
  downloadUrl: string;
  notes: string;
  publishedAt: string | null;
  platform: "windows";
};

const FALLBACK_VERSION = "1.0.4_public_beta";
const FALLBACK_DOWNLOAD_URL =
  "https://www.brazilianremixservice.com.br/downloads/BRS-Downloader_1.0.4_public_beta_x64-setup.exe";
const FALLBACK_NOTES =
  "BRS Downloader 1.0.4_public_beta: links /atualizacoes no import, update interno sem navegador e WhatsApp de suporte.";
const FALLBACK_PUBLISHED_AT = "2026-09-08T22:20:00.000Z";

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Compara versões semver simples (1.2.3). Retorna >0 se a > b. */
export function compareSemver(a: string, b: string): number {
  const normalize = (value: string) =>
    value
      .replace(/^v/i, "")
      .split(/[.+_-]/)
      .map((part) => Number.parseInt(part, 10) || 0);
  const pa = normalize(a);
  const pb = normalize(b);
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

  // Env só ganha se for mais nova que o fallback embutido (evita URL antiga/404 no Vercel).
  const envIsNewer =
    Boolean(envVersion && envUrl) && compareSemver(envVersion!, FALLBACK_VERSION) > 0;

  if (envIsNewer) {
    return {
      version: envVersion!,
      downloadUrl: envUrl!,
      notes: envNotes ?? FALLBACK_NOTES,
      publishedAt: envPublishedAt ?? FALLBACK_PUBLISHED_AT,
      platform: "windows",
    };
  }

  return {
    version: FALLBACK_VERSION,
    downloadUrl: FALLBACK_DOWNLOAD_URL,
    notes: FALLBACK_NOTES,
    publishedAt: FALLBACK_PUBLISHED_AT,
    platform: "windows",
  };
}
