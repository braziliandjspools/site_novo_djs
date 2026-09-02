import type { DownloadJob } from "../api/jobs";

export type ConnectionState = "online" | "offline" | "connecting";

/** Estados exibidos na fila local (aguardando download). */
export const QUEUE_STATUSES = new Set(["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED", "FAILED"]);

export type DownloadManagerSnapshot = {
  jobs: DownloadJob[];
  connectionState: ConnectionState;
  error: string | null;
  pendingCount: number;
  activeJobId: number | null;
};

export type DownloadManagerListener = (snapshot: DownloadManagerSnapshot) => void;

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
  heartbeat: () => Promise<void>;
};

export const PROGRESS_SYNC_MS = 12_000;
