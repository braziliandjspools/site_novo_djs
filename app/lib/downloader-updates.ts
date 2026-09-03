/**
 * Manifesto de release do Downloader.
 * Configure no Vercel (ou .env):
 * - DOWNLOADER_LATEST_VERSION=0.3.0
 * - DOWNLOADER_DOWNLOAD_URL=https://.../BRS-Downloader-Setup.exe
 * - DOWNLOADER_RELEASE_NOTES=Correções de login e sininho unificado
 * - DOWNLOADER_RELEASE_PUBLISHED_AT=2026-09-03T20:00:00.000Z (opcional)
 */

export type DownloaderReleaseManifest = {
  version: string;
  downloadUrl: string;
  notes: string;
  publishedAt: string | null;
  platform: "windows";
};

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function getDownloaderReleaseManifest(): DownloaderReleaseManifest | null {
  const version = cleanEnv(process.env.DOWNLOADER_LATEST_VERSION);
  const downloadUrl = cleanEnv(process.env.DOWNLOADER_DOWNLOAD_URL);
  if (!version || !downloadUrl) return null;

  return {
    version,
    downloadUrl,
    notes: cleanEnv(process.env.DOWNLOADER_RELEASE_NOTES) ?? "Nova versão do BRS Downloader.",
    publishedAt: cleanEnv(process.env.DOWNLOADER_RELEASE_PUBLISHED_AT),
    platform: "windows",
  };
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
