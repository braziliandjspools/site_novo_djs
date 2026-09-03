import { NextResponse } from "next/server";
import { requireDownloaderAccess } from "../../../../../lib/downloader-access";
import { dismissDownloadJob } from "../../../../../lib/downloader";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireDownloaderAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await context.params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId < 1) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const job = await dismissDownloadJob(access.user.id, jobId);
    if (!job) {
      return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover do histórico.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
