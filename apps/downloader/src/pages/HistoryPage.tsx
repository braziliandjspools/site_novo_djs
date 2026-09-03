import { ExternalLink, FolderOpen, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { JobRow } from "../components/downloads/JobRow";
import { DownloadFinderToolbar } from "../components/downloads/DownloadFinderToolbar";
import { BulkSelectionBar } from "../components/downloads/BulkSelectionBar";
import { useServerJobs } from "../hooks/useServerJobs";
import { createJob, retryJob } from "../lib/api/jobs";
import { openPlatform } from "../lib/open-site";
import { openDownloadDir } from "../lib/native/download";
import { useAuth } from "../context/AuthContext";
import { useDownloadManager } from "../context/DownloadManagerContext";
import {
  canBulkDismiss,
  canBulkRetry,
  filterFinderJobs,
  type DownloadFinderFilter,
} from "../lib/download/job-finder";
import {
  EMPTY_ORG_FILTERS,
  collectOrgFacets,
  filterJobsByOrgMeta,
  groupJobsByOrg,
  type OrgGroupBy,
  type OrgMetaFilters,
} from "../lib/download/job-organization";
import { DownloadOrgToolbar } from "../components/downloads/DownloadOrgToolbar";

export function HistoryPage() {
  const { sessionToken } = useAuth();
  const {
    syncNow,
    dismissJob: dismissQueueJob,
    retryJob: retryQueueJob,
    dismissJobs,
    retryJobs,
  } = useDownloadManager();
  const { jobs, loading, error, refresh } = useServerJobs({ limit: 500, pollMs: 3000 });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [statusFilter, setStatusFilter] = useState<DownloadFinderFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [orgFilters, setOrgFilters] = useState<OrgMetaFilters>({ ...EMPTY_ORG_FILTERS });
  const [groupBy, setGroupBy] = useState<OrgGroupBy>("none");

  const historyJobs = useMemo(
    () => jobs.filter((job) => job.status === "COMPLETED" || job.status === "FAILED"),
    [jobs],
  );

  const orgFacets = useMemo(() => collectOrgFacets(historyJobs), [historyJobs]);

  const { visible: statusFiltered, counts } = useMemo(
    () => filterFinderJobs(historyJobs, { query: deferredQuery, filter: statusFilter }),
    [deferredQuery, historyJobs, statusFilter],
  );

  const filteredJobs = useMemo(
    () => filterJobsByOrgMeta(statusFiltered, orgFilters),
    [orgFilters, statusFiltered],
  );

  const jobGroups = useMemo(() => groupJobsByOrg(filteredJobs, groupBy), [filteredJobs, groupBy]);

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
        dismissQueueJob(jobId);
      } else {
        dismissJobs([jobId]);
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  function toggleSelect(jobId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
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

      <DownloadFinderToolbar
        query={query}
        onQueryChange={setQuery}
        filter={statusFilter}
        onFilterChange={setStatusFilter}
        counts={counts}
      />

      <DownloadOrgToolbar
        facets={orgFacets}
        filters={orgFilters}
        groupBy={groupBy}
        onFiltersChange={setOrgFilters}
        onGroupByChange={setGroupBy}
      />

      <BulkSelectionBar
        selectedCount={selectedIds.size}
        visibleCount={filteredJobs.length}
        allVisibleSelected={allVisibleSelected}
        busy={bulkBusy}
        canPause={false}
        canResume={false}
        canCancel={false}
        canRetry={selectedJobs.some(canBulkRetry)}
        canDismiss={selectedJobs.some(canBulkDismiss)}
        onSelectAll={() => setSelectedIds(new Set(filteredJobs.map((job) => job.id)))}
        onClearSelection={() => setSelectedIds(new Set())}
        onPause={() => undefined}
        onResume={() => undefined}
        onCancel={() => undefined}
        onRetry={() => {
          void (async () => {
            setBulkBusy(true);
            try {
              const ids = selectedJobs.filter(canBulkRetry).map((job) => job.id);
              retryJobs(ids);
              setSelectedIds(new Set());
              syncNow();
              await refresh();
            } finally {
              setBulkBusy(false);
            }
          })();
        }}
        onDismiss={() => {
          void (async () => {
            setBulkBusy(true);
            try {
              const ids = selectedJobs.filter(canBulkDismiss).map((job) => job.id);
              dismissJobs(ids);
              setSelectedIds(new Set());
              await refresh();
            } finally {
              setBulkBusy(false);
            }
          })();
        }}
      />

      {error && <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1db954]" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <p className="rounded-lg border border-zinc-800 bg-[#181818]/80 px-4 py-8 text-center text-sm text-zinc-500">
          {historyJobs.length === 0
            ? "Nenhum item no histórico."
            : "Nenhum download corresponde à busca/filtro."}
        </p>
      ) : (
        <div className="space-y-5">
          {jobGroups.map((group) => (
            <div key={group.key} className="space-y-2">
              {groupBy !== "none" && (
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                    {group.label}
                  </p>
                  <span className="text-[11px] tabular-nums text-zinc-600">{group.jobs.length}</span>
                </div>
              )}
              {group.jobs.map((job) => (
                <div key={job.id} className="space-y-2">
                  <JobRow
                    job={job}
                    isActive={false}
                    selectable
                    selected={selectedIds.has(job.id)}
                    onToggleSelect={() => toggleSelect(job.id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
