import { ExternalLink, FolderOpen, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { JobRow } from "../components/downloads/JobRow";
import { useServerJobs } from "../hooks/useServerJobs";
import { createJob, dismissJob, retryJob } from "../lib/api/jobs";
import { openPlatform } from "../lib/open-site";
import { openDownloadDir } from "../lib/native/download";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";

export function HistoryPage() {
  const { sessionToken } = useAuth();
  const { syncNow, dismissJob: dismissQueueJob, retryJob: retryQueueJob } = useDownloadManager();
  const { jobs, loading, error, refresh } = useServerJobs({ limit: 200, pollMs: 3000 });
  const [busyId, setBusyId] = useState<number | null>(null);

  const historyJobs = jobs.filter((job) => job.status === "COMPLETED" || job.status === "FAILED");

  async function handleOpenFolder() {
    await openDownloadDir();
  }

  async function handleRedownload(jobId: number) {
    const job = historyJobs.find((item) => item.id === jobId);
    if (!job || !sessionToken) return;

    setBusyId(jobId);
    try {
      if (job.status === "FAILED") {
        await retryJob(sessionToken, job.id);
        retryQueueJob(job.id);
      } else {
        await createJob(sessionToken, {
          fileId: job.fileId,
          fileName: job.fileName,
          relativePath: job.relativePath,
          targetDeviceId: job.targetDeviceId,
          provider: job.provider,
        });
      }
      syncNow();
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDismiss(jobId: number) {
    if (!sessionToken) return;
    setBusyId(jobId);
    try {
      const job = historyJobs.find((item) => item.id === jobId);
      if (job?.status === "FAILED") {
        // Remove da fila local + dismiss no backend (evita chamada duplicada)
        dismissQueueJob(jobId);
      } else {
        await dismissJob(sessionToken, jobId);
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">Histórico</p>
          <p className="mt-1 text-sm text-zinc-500">
            Downloads concluídos e falhas recentes — atualiza em tempo real.
          </p>
        </div>
        <Button variant="secondary" className="text-xs sm:text-sm" onClick={() => void openPlatform()}>
          <ExternalLink className="h-4 w-4" />
          Abrir plataforma
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1db954]" />
        </div>
      ) : historyJobs.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-[#181818]/80 px-4 py-8 text-center text-sm text-zinc-500">
          Nenhum item no histórico.
        </p>
      ) : (
        <div className="space-y-2">
          {historyJobs.map((job) => (
            <div key={job.id} className="space-y-2">
              <JobRow
                job={job}
                isActive={false}
                onRetry={job.status === "FAILED" ? () => void handleRedownload(job.id) : undefined}
                onDismiss={
                  job.status === "FAILED" || job.status === "COMPLETED"
                    ? () => void handleDismiss(job.id)
                    : undefined
                }
              />
              <div className="flex flex-wrap gap-2 px-1">
                <Button
                  variant="secondary"
                  className="!h-8 !px-3 !text-[11px]"
                  disabled={busyId === job.id}
                  onClick={() => void handleOpenFolder()}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Abrir pasta
                </Button>
                <Button
                  variant="secondary"
                  className="!h-8 !px-3 !text-[11px]"
                  disabled={busyId === job.id}
                  onClick={() => void handleRedownload(job.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Baixar novamente
                </Button>
                <Button
                  variant="ghost"
                  className="!h-8 !px-3 !text-[11px] text-zinc-400"
                  disabled={busyId === job.id}
                  onClick={() => void handleDismiss(job.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover do histórico
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
