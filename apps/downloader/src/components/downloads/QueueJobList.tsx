import { useRef, useState } from "react";
import { JobRow } from "./JobRow";
import type { DownloadJob } from "../../lib/api/jobs";
import type { JobProgressMetrics } from "../../lib/download/types";

type QueueJobListProps = {
  jobs: DownloadJob[];
  activeJobIds: number[];
  jobMetrics: Record<number, JobProgressMetrics>;
  showQueueActions?: boolean;
  enableDragReorder?: boolean;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (jobId: number) => void;
  onPause: (jobId: number) => void;
  onResume: (jobId: number) => void;
  onCancel: (jobId: number) => void;
  onRetry: (jobId: number) => void;
  onDismiss: (jobId: number) => void;
  onDownloadNow: (jobId: number) => void;
  onMoveToTop: (jobId: number) => void;
  onMoveUp: (jobId: number) => void;
  onMoveDown: (jobId: number) => void;
  onMoveToEnd: (jobId: number) => void;
  onReorder: (orderedIds: number[]) => void;
};

export function QueueJobList({
  jobs,
  activeJobIds,
  jobMetrics,
  showQueueActions = true,
  enableDragReorder = true,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onDismiss,
  onDownloadNow,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onMoveToEnd,
  onReorder,
}: QueueJobListProps) {
  const dragIdRef = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  function handleDrop(targetId: number) {
    const sourceId = dragIdRef.current;
    dragIdRef.current = null;
    setDragOverId(null);
    if (sourceId == null || sourceId === targetId) return;

    const ids = jobs.map((job) => job.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    onReorder(next);
  }

  return (
    <div className="space-y-2.5">
      {jobs.map((job) => (
        <div
          key={job.id}
          className={dragOverId === job.id ? "rounded-2xl ring-1 ring-[#1db954]/40" : undefined}
        >
          <JobRow
            job={job}
            isActive={activeJobIds.includes(job.id)}
            metrics={jobMetrics[job.id]}
            showQueueActions={showQueueActions}
            selectable={selectable}
            selected={selectedIds?.has(job.id) ?? false}
            onToggleSelect={onToggleSelect ? () => onToggleSelect(job.id) : undefined}
            draggable={enableDragReorder && showQueueActions}
            onDragStart={(event) => {
              dragIdRef.current = job.id;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(job.id));
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dragOverId !== job.id) setDragOverId(job.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(job.id);
            }}
            onDragEnd={() => {
              dragIdRef.current = null;
              setDragOverId(null);
            }}
            onDownloadNow={() => onDownloadNow(job.id)}
            onMoveToTop={() => onMoveToTop(job.id)}
            onMoveUp={() => onMoveUp(job.id)}
            onMoveDown={() => onMoveDown(job.id)}
            onMoveToEnd={() => onMoveToEnd(job.id)}
            onPause={() => onPause(job.id)}
            onResume={() => onResume(job.id)}
            onCancel={() => onCancel(job.id)}
            onRetry={() => onRetry(job.id)}
            onDismiss={() => onDismiss(job.id)}
          />
        </div>
      ))}
    </div>
  );
}
