import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../lib/downloader-access";
import { createDownloadJobsBatch, parseBatchCreateJobsBody } from "../../../../lib/downloader";

export const dynamic = "force-dynamic";

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

  const parsed = parseBatchCreateJobsBody(body);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const jobs = await createDownloadJobsBatch(access.user.id, parsed.value!);
    return NextResponse.json({ ok: true, jobs, count: jobs.length }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar jobs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
