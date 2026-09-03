import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../lib/downloader-access";
import {
  createDownloadJob,
  listDownloadJobs,
  parseCreateJobBody,
  parseListJobsQuery,
} from "../../../lib/downloader";
import { handleDownloaderCorsPreflight, withDownloaderCorsJson } from "../../../lib/downloader-cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return withDownloaderCorsJson(request, { error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseListJobsQuery(searchParams);
  if ("error" in parsed && parsed.error) {
    return withDownloaderCorsJson(request, { error: parsed.error }, { status: 400 });
  }

  const jobs = await listDownloadJobs(access.user.id, parsed.value!);
  return withDownloaderCorsJson(request, { ok: true, jobs });
}

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

  const parsed = parseCreateJobBody(body);
  if ("error" in parsed && parsed.error) {
    return withDownloaderCorsJson(request, { error: parsed.error }, { status: 400 });
  }

  const job = await createDownloadJob(access.user.id, parsed.value!);
  return withDownloaderCorsJson(request, { ok: true, job }, { status: 201 });
}
