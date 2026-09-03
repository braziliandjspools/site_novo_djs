import { ExternalLink, WifiOff } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { Button } from "../components/ui/Button";
import { openPlatform } from "../lib/open-site";
import { EmptyQueueState } from "../components/downloads/EmptyQueueState";
import { QueueJobList } from "../components/downloads/QueueJobList";
import {
  estimateQueueBytes,
  formatDiskSize,
  jobKnownTotalBytes,
} from "../lib/download/disk-space-utils";
import type { DownloadJob } from "../lib/api/jobs";

export type JobSection = "downloads" | "queue";

const SECTION_COPY: Record<
  JobSection,
  { eyebrow: string; empty: string; filter: (job: DownloadJob, activeJobIds: number[]) => boolean }
> = {
  downloads: {
    eyebrow: "Downloads",
    empty: "Nenhum download em andamento.",
    filter: (job, activeJobIds) =>
      job.status === "DOWNLOADING" || job.status === "PAUSED" || activeJobIds.includes(job.id),
  },
  queue: {
    eyebrow: "Fila",
    empty: "Nenhum item aguardando download.",
    filter: (job) => job.status === "PENDING" || job.status === "RECEIVED" || job.status === "FAILED",
  },
};

type JobsSectionPageProps = {
  section: JobSection;
};

function formatQueueLabel(queueBytes: number, jobs: DownloadJob[]) {
  if (queueBytes > 0) return formatDiskSize(queueBytes);
  const eligible = jobs.filter(
    (job) =>
      job.status === "PENDING" ||
      job.status === "RECEIVED" ||
      job.status === "FAILED" ||
      job.status === "PAUSED" ||
      job.status === "DOWNLOADING",
  );
  if (eligible.length === 0) return "0 B";
  const anyKnown = eligible.some((job) => jobKnownTotalBytes(job) > 0);
  return anyKnown ? "0 B" : "Sem tamanho informado";
}

export function JobsSectionPage({ section }: JobsSectionPageProps) {
  const { device } = useAuth();
  const {
    jobs,
    connectionState,
    workerError,
    activeJobIds,
    maxConcurrency,
    jobMetrics,
    diskSpace,
    pauseJob,
    resumeJob,
    cancelJob,
    retryJob,
    dismissJob,
    downloadNow,
    moveJobToTop,
    moveJobUp,
    moveJobDown,
    moveJobToEnd,
    reorderQueue,
  } = useDownloadManager();

  const copy = SECTION_COPY[section];
  const filteredJobs = useMemo(
    () => jobs.filter((job) => copy.filter(job, activeJobIds)),
    [activeJobIds, copy, jobs],
  );
  const isOffline = connectionState === "offline";
  const isQueue = section === "queue";

  const liveQueueBytes = useMemo(
    () => Math.max(diskSpace.queueBytes, estimateQueueBytes(jobs, device?.deviceId ?? "")),
    [device?.deviceId, diskSpace.queueBytes, jobs],
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">{copy.eyebrow}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {filteredJobs.length === 0
              ? copy.empty
              : `${filteredJobs.length} item(ns) · ${activeJobIds.length}/${maxConcurrency} ativos`}
          </p>
        </div>
        <Button variant="primary" className="text-xs sm:text-sm" onClick={() => void openPlatform()}>
          <ExternalLink className="h-4 w-4" />
          Abrir plataforma
        </Button>
      </div>

      {section === "downloads" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Espaço disponível
            </p>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-white">
              {diskSpace.availableBytes != null ? formatDiskSize(diskSpace.availableBytes) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Na fila
            </p>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-[#1db954]">
              {formatQueueLabel(liveQueueBytes, jobs)}
            </p>
          </div>
        </div>
      )}

      {section === "queue" && (
        <div className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Tamanho estimado na fila
          </p>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-[#1db954]">
            {formatQueueLabel(liveQueueBytes, jobs)}
          </p>
        </div>
      )}

      {section === "downloads" && diskSpace.insufficientSpace && !isOffline && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {diskSpace.insufficientSpace}
        </p>
      )}

      {isOffline && (
        <p className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          Sem conexão
        </p>
      )}

      {workerError && !isOffline && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{workerError}</p>
      )}

      {filteredJobs.length === 0 ? (
        section === "downloads" && activeJobIds.length > 0 ? (
          <p className="text-sm text-zinc-500">Preparando próximo arquivo…</p>
        ) : (
          <EmptyQueueState offline={isOffline} />
        )
      ) : (
        <QueueJobList
          jobs={filteredJobs}
          activeJobIds={activeJobIds}
          jobMetrics={jobMetrics}
          showQueueActions={isQueue || section === "downloads"}
          enableDragReorder={isQueue}
          onPause={pauseJob}
          onResume={resumeJob}
          onCancel={cancelJob}
          onRetry={retryJob}
          onDismiss={dismissJob}
          onDownloadNow={downloadNow}
          onMoveToTop={moveJobToTop}
          onMoveUp={moveJobUp}
          onMoveDown={moveJobDown}
          onMoveToEnd={moveJobToEnd}
          onReorder={reorderQueue}
        />
      )}
    </div>
  );
}
