import { NextResponse } from "next/server";
import { abuseJsonBody, requireDownloaderAccess } from "../../../lib/downloader-access";
import {
  createDownloadJob,
  listDownloadJobs,
  parseCreateJobBody,
  parseListJobsQuery,
} from "../../../lib/downloader";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";
import { DownloadAbuseBannedError } from "../../../lib/download-abuse";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    if ("abuse" in access && access.abuse) {
      return withDownloaderCorsJson(request, abuseJsonBody(access.abuse, access.error), {
        status: access.status,
      });
    }
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseListJobsQuery(searchParams);
  if ("error" in parsed && parsed.error) {
    return withDownloaderCorsJson(request, { error: parsed.error }, { status: 400 });
  }

  try {
    const jobs = await listDownloadJobs(access.user.id, parsed.value!);
    return withDownloaderCorsJson(request, {
      ok: true,
      jobs,
      abuse: access.abuseWarning.alerted || access.abuseWarning.banned ? access.abuseWarning : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar a fila.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    if ("abuse" in access && access.abuse) {
      return withDownloaderCorsJson(request, abuseJsonBody(access.abuse, access.error), {
        status: access.status,
      });
    }
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withDownloaderCorsJson(request, { error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = parseCreateJobBody(body);
  if ("error" in parsed && parsed.error) {
    return withDownloaderCorsJson(request, { error: parsed.error }, { status: 400 });
  }

  try {
    const job = await createDownloadJob(access.user.id, parsed.value!);
    return withDownloaderCorsJson(request, { ok: true, job }, { status: 201 });
  } catch (error) {
    if (error instanceof DownloadAbuseBannedError) {
      return withDownloaderCorsJson(request, abuseJsonBody(error.abuse, error.message), {
        status: 403,
      });
    }
    const message = error instanceof Error ? error.message : "Erro ao criar job.";
    return withDownloaderCorsJson(request, { error: message }, { status: 500 });
  }
}
