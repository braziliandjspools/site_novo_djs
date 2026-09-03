import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import {
  batchDownloadJobActions,
  parseBatchJobActionsBody,
} from "../../../../lib/downloader";
import {
  handleDownloaderCorsPreflight,
  withDownloaderCorsJson,
} from "../../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

/** Ações em lote sobre jobs (pause/resume/cancel/retry/dismiss). */
export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withDownloaderCorsJson(request, { error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = parseBatchJobActionsBody(body);
  if (parsed.error || !parsed.value) {
    return withDownloaderCorsJson(request, { error: parsed.error ?? "Requisição inválida." }, { status: 400 });
  }

  try {
    const result = await batchDownloadJobActions(
      access.user.id,
      parsed.value.action,
      parsed.value.jobIds,
    );
    return withDownloaderCorsJson(request, {
      ok: true,
      action: parsed.value.action,
      requested: parsed.value.jobIds.length,
      affected: result.affected,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível aplicar a ação em lote.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
