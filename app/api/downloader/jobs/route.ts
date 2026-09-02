import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../lib/downloader-access";
import {
  createDownloadJob,
  listDownloadJobs,
  parseCreateJobBody,
  parseListJobsQuery,
} from "../../../lib/downloader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseListJobsQuery(searchParams);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const jobs = await listDownloadJobs(access.user.id, parsed.value!);
  return NextResponse.json({ ok: true, jobs });
}

export async function POST(request: Request) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = parseCreateJobBody(body);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const job = await createDownloadJob(access.user.id, parsed.value!);
  return NextResponse.json({ ok: true, job }, { status: 201 });
}
