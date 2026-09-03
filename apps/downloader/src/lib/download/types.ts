import type { DownloadJob } from "../api/jobs";
import type { DiskSpaceSnapshot } from "./disk-space-utils";
import type { ZipTask } from "./zip-coordinator";

export type { DiskSpaceSnapshot };
export type { ZipTask };

export type ConnectionState = "online" | "offline" | "connecting";

/** Estados exibidos na fila local (aguardando download). */
export const QUEUE_STATUSES = new Set(["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED", "FAILED"]);

export type JobProgressMetrics = {
  speedBytesPerSec: number;
  etaSeconds: number | null;
};

export type DownloadManagerSnapshot = {
  jobs: DownloadJob[];
  connectionState: ConnectionState;
  error: string | null;
  pendingCount: number;
  activeJobIds: number[];
  maxConcurrency: number;
  globalPaused: boolean;
  autoDownload: boolean;
  jobMetrics: Record<number, JobProgressMetrics>;
  diskSpace: DiskSpaceSnapshot;
  zipTasks: ZipTask[];
};

export type DownloadManagerListener = (snapshot: DownloadManagerSnapshot) => void;

export type BatchJobTransportAction = "pause" | "resume" | "cancel" | "retry" | "dismiss";

export type QueueTransport = {
  listJobs: () => Promise<DownloadJob[]>;
  claimJob: (jobId: number) => Promise<DownloadJob>;
  updateJob: (
    jobId: number,
    payload: {
      status?: string;
      progress?: number;
      downloadedBytes?: string;
      totalBytes?: string | null;
      error?: string | null;
    },
  ) => Promise<DownloadJob>;
  cancelJob: (jobId: number) => Promise<DownloadJob>;
  retryJob: (jobId: number) => Promise<DownloadJob>;
  dismissJob: (jobId: number) => Promise<DownloadJob>;
  /** Uma requisição HTTP para N jobs (quando o backend permitir). */
  batchActions?: (
    action: BatchJobTransportAction,
    jobIds: number[],
  ) => Promise<{ affected: number }>;
  heartbeat: () => Promise<void>;
};

export const PROGRESS_SYNC_MS = 1_500;
export const PROGRESS_UI_MS = 500;
export const DEFAULT_MAX_CONCURRENCY = 3;
