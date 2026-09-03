import { ExternalLink, Loader2, WifiOff } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import { Button } from "../components/ui/Button";
import { openPlatform } from "../lib/open-site";
import { EmptyQueueState } from "../components/downloads/EmptyQueueState";
import { QueueJobList } from "../components/downloads/QueueJobList";
import { DownloadFinderToolbar } from "../components/downloads/DownloadFinderToolbar";
import { BulkSelectionBar } from "../components/downloads/BulkSelectionBar";
import { useServerJobs } from "../hooks/useServerJobs";
import {
  estimateQueueBytes,
  formatDiskSize,
  jobKnownTotalBytes,
} from "../lib/download/disk-space-utils";
import {
  buildStressCatalogJobs,
  canBulkCancel,
  canBulkDismiss,
  canBulkPause,
  canBulkResume,
  canBulkRetry,
  filterFinderJobs,
  mergeDownloadCatalog,
  type DownloadFinderFilter,
} from "../lib/download/job-finder";
import type { DownloadJob } from "../lib/api/jobs";

export type JobSection = "downloads" | "queue";

const SECTION_COPY: Record<
  JobSection,
  { eyebrow: string; empty: string; filter: (job: DownloadJob, activeJobIds: number[]) => boolean }
> = {
  downloads: {
    eyebrow: "Downloads",
    empty: "Nenhum download encontrado.",
    filter: () => true,
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

function useStressCatalogEnabled() {
  return useMemo(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return false;
    try {
      return new URLSearchParams(window.location.search).get("stress") === "500";
    } catch {
      return false;
    }
  }, []);
}

export function JobsSectionPage({ section }: JobsSectionPageProps) {
  const { device } = useAuth();
  const {
    jobs: managerJobs,
    connectionState,
    workerError,
    activeJobIds,
    maxConcurrency,
    jobMetrics,
    diskSpace,
    syncNow,
    pauseJob,
    resumeJob,
    cancelJob,
    retryJob,
    dismissJob,
    pauseJobs,
    resumeJobs,
    cancelJobs,
    retryJobs,
    dismissJobs,
    downloadNow,
    moveJobToTop,
    moveJobUp,
    moveJobDown,
    moveJobToEnd,
    reorderQueue,
  } = useDownloadManager();

  const isDownloads = section === "downloads";
  const isQueue = section === "queue";
  const stressEnabled = useStressCatalogEnabled();

  const { jobs: serverJobs, loading: serverLoading } = useServerJobs({
    limit: 500,
    pollMs: isDownloads ? 8000 : undefined,
    enabled: isDownloads,
  });

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState<DownloadFinderFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const copy = SECTION_COPY[section];

  const catalog = useMemo(() => {
    if (isQueue) {
      return managerJobs.filter((job) => copy.filter(job, activeJobIds));
    }
    const merged = mergeDownloadCatalog(managerJobs, serverJobs);
    if (!stressEnabled) return merged;
    if (merged.length >= 500) return merged;
    return mergeDownloadCatalog(merged, buildStressCatalogJobs(500 - merged.length));
  }, [activeJobIds, copy, isQueue, managerJobs, serverJobs, stressEnabled]);

  const { visible: filteredJobs, counts } = useMemo(
    () => filterFinderJobs(catalog, { query: deferredQuery, filter: statusFilter }),
    [catalog, deferredQuery, statusFilter],
  );

  // Limpa seleção de itens que saíram da lista visível.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(filteredJobs.map((job) => job.id));
      let changed = false;
      const next = new Set<number>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [filteredJobs]);

  const selectedJobs = useMemo(
    () => filteredJobs.filter((job) => selectedIds.has(job.id)),
    [filteredJobs, selectedIds],
  );

  const allVisibleSelected =
    filteredJobs.length > 0 && filteredJobs.every((job) => selectedIds.has(job.id));

  const isOffline = connectionState === "offline";

  const liveQueueBytes = useMemo(
    () => Math.max(diskSpace.queueBytes, estimateQueueBytes(managerJobs, device?.deviceId ?? "")),
    [device?.deviceId, diskSpace.queueBytes, managerJobs],
  );

  function toggleSelect(jobId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredJobs.map((job) => job.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function runBulk(action: () => void | Promise<void>) {
    setBulkBusy(true);
    try {
      await action();
      clearSelection();
      syncNow();
    } finally {
      setBulkBusy(false);
    }
  }

  const ids = () => selectedJobs.map((job) => job.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1db954]">{copy.eyebrow}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {filteredJobs.length === 0
              ? copy.empty
              : `${filteredJobs.length} item(ns) · ${activeJobIds.length}/${maxConcurrency} ativos`}
            {stressEnabled ? " · stress 500" : ""}
          </p>
        </div>
        <Button variant="primary" className="text-xs sm:text-sm" onClick={() => void openPlatform()}>
          <ExternalLink className="h-4 w-4" />
          Abrir plataforma
        </Button>
      </div>

      {isDownloads && (
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
              {formatQueueLabel(liveQueueBytes, managerJobs)}
            </p>
          </div>
        </div>
      )}

      {isQueue && (
        <div className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Tamanho estimado na fila
          </p>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-[#1db954]">
            {formatQueueLabel(liveQueueBytes, managerJobs)}
          </p>
        </div>
      )}

      <DownloadFinderToolbar
        query={query}
        onQueryChange={setQuery}
        filter={statusFilter}
        onFilterChange={setStatusFilter}
        counts={counts}
      />

      <BulkSelectionBar
        selectedCount={selectedIds.size}
        visibleCount={filteredJobs.length}
        allVisibleSelected={allVisibleSelected}
        busy={bulkBusy}
        canPause={selectedJobs.some(canBulkPause)}
        canResume={selectedJobs.some(canBulkResume)}
        canCancel={selectedJobs.some(canBulkCancel)}
        canRetry={selectedJobs.some(canBulkRetry)}
        canDismiss={selectedJobs.some(canBulkDismiss)}
        onSelectAll={selectAllVisible}
        onClearSelection={clearSelection}
        onPause={() =>
          void runBulk(() => {
            pauseJobs(ids().filter((id) => {
              const job = selectedJobs.find((item) => item.id === id);
              return job ? canBulkPause(job) : false;
            }));
          })
        }
        onResume={() =>
          void runBulk(() => {
            resumeJobs(ids().filter((id) => {
              const job = selectedJobs.find((item) => item.id === id);
              return job ? canBulkResume(job) : false;
            }));
          })
        }
        onCancel={() =>
          void runBulk(() => {
            cancelJobs(ids().filter((id) => {
              const job = selectedJobs.find((item) => item.id === id);
              return job ? canBulkCancel(job) : false;
            }));
          })
        }
        onRetry={() =>
          void runBulk(() => {
            retryJobs(ids().filter((id) => {
              const job = selectedJobs.find((item) => item.id === id);
              return job ? canBulkRetry(job) : false;
            }));
          })
        }
        onDismiss={() =>
          void runBulk(() => {
            dismissJobs(ids().filter((id) => {
              const job = selectedJobs.find((item) => item.id === id);
              return job ? canBulkDismiss(job) : false;
            }));
          })
        }
      />

      {isDownloads && diskSpace.insufficientSpace && !isOffline && (
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

      {isDownloads && serverLoading && catalog.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1db954]" />
        </div>
      ) : filteredJobs.length === 0 ? (
        isDownloads && activeJobIds.length > 0 && !deferredQuery && statusFilter === "all" ? (
          <p className="text-sm text-zinc-500">Preparando próximo arquivo…</p>
        ) : deferredQuery || statusFilter !== "all" ? (
          <p className="rounded-lg border border-zinc-800 bg-[#181818]/80 px-4 py-8 text-center text-sm text-zinc-500">
            Nenhum download corresponde à busca/filtro.
          </p>
        ) : (
          <EmptyQueueState offline={isOffline} />
        )
      ) : (
        <QueueJobList
          jobs={filteredJobs}
          activeJobIds={activeJobIds}
          jobMetrics={jobMetrics}
          showQueueActions={isQueue || isDownloads}
          enableDragReorder={isQueue}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
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
