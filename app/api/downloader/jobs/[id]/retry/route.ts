import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../../lib/downloader-access";
import { retryDownloadJob } from "../../../../../lib/downloader";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseJobId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export async function POST(_request: Request, context: RouteContext) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const jobId = parseJobId((await context.params).id);
  if (!jobId) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const job = await retryDownloadJob(access.user.id, jobId);
    if (!job) {
      return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao reenviar job.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
