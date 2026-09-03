import { NextResponse } from "next/server";

import { compareSemver, getDownloaderReleaseManifest } from "../../../../lib/downloader-updates";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

/**
 * GET /api/downloader/updates/latest?current=0.2.0
 * Público (só metadados de release). Sem auth.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const current = (searchParams.get("current") ?? "0.0.0").trim() || "0.0.0";
  const manifest = getDownloaderReleaseManifest();

  if (!manifest) {
    return withDownloaderCorsJson(request, {
      updateAvailable: false,
      currentVersion: current,
      latest: null,
      message: "Nenhuma versão publicada no servidor ainda.",
    });
  }

  const updateAvailable = compareSemver(manifest.version, current) > 0;

  return withDownloaderCorsJson(request, {
    updateAvailable,
    currentVersion: current,
    latest: updateAvailable
      ? {
          version: manifest.version,
          downloadUrl: manifest.downloadUrl,
          notes: manifest.notes,
          publishedAt: manifest.publishedAt,
          platform: manifest.platform,
        }
      : null,
    message: updateAvailable
      ? `Nova versão ${manifest.version} disponível.`
      : `Você já está na versão mais recente (${manifest.version}).`,
  });
}
