import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../../lib/downloader-cors";
import { listPackDayContents } from "../../../../lib/pack-download";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  const folderId = new URL(request.url).searchParams.get("folderId")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    return withDownloaderCorsJson(request, { error: "Pasta inválida." }, { status: 400 });
  }

  try {
    const contents = await listPackDayContents(folderId);
    return withDownloaderCorsJson(request, { ok: true, ...contents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível listar a pasta.";
    return withDownloaderCorsJson(request, { error: message }, { status: 502 });
  }
}
