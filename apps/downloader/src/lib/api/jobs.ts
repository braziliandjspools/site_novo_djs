import { apiFetch } from "./client";

export type DownloadJob = {
  id: number;
  provider: string;
  fileId: string;
  fileName: string;
  relativePath: string | null;
  targetDeviceId: string | null;
  fileSize: string | null;
  mimeType: string | null;
  status: string;
  progress: number;
  downloadedBytes: string;
  totalBytes: string | null;
  error: string | null;
  deviceId: string | null;
  deviceName: string | null;
  claimedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListJobsResponse = { ok: true; jobs: DownloadJob[] };
type JobResponse = { ok: true; job: DownloadJob };

export async function listJobs(
  token: string,
  filters: { status?: string; deviceId?: string; queue?: boolean; limit?: number } = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.deviceId) params.set("deviceId", filters.deviceId);
  if (filters.queue) params.set("queue", "1");
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return apiFetch<ListJobsResponse>(`/api/downloader/jobs${query ? `?${query}` : ""}`, {
    method: "GET",
    token,
  });
}

export async function claimJob(token: string, jobId: number, deviceId: string) {
  return apiFetch<JobResponse>(`/api/downloader/jobs/${jobId}/claim`, {
    method: "POST",
    token,
    body: JSON.stringify({ deviceId }),
  });
}

export async function updateJob(
  token: string,
  jobId: number,
  payload: {
    status?: string;
    progress?: number;
    downloadedBytes?: string;
    totalBytes?: string | null;
    error?: string | null;
    deviceId: string;
  },
) {
  return apiFetch<JobResponse>(`/api/downloader/jobs/${jobId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export async function cancelJob(token: string, jobId: number) {
  return apiFetch<JobResponse>(`/api/downloader/jobs/${jobId}/cancel`, {
    method: "POST",
    token,
  });
}

export async function retryJob(token: string, jobId: number) {
  return apiFetch<JobResponse>(`/api/downloader/jobs/${jobId}/retry`, {
    method: "POST",
    token,
  });
}

export async function dismissJob(token: string, jobId: number) {
  return apiFetch<JobResponse>(`/api/downloader/jobs/${jobId}/dismiss`, {
    method: "POST",
    token,
  });
}

export type BatchJobAction = "pause" | "resume" | "cancel" | "retry" | "dismiss";

export async function batchJobActions(
  token: string,
  action: BatchJobAction,
  jobIds: number[],
) {
  return apiFetch<{
    ok: true;
    action: BatchJobAction;
    requested: number;
    affected: number;
  }>("/api/downloader/jobs/actions", {
    method: "POST",
    token,
    body: JSON.stringify({ action, jobIds }),
  });
}

export async function createJob(
  token: string,
  payload: {
    fileId: string;
    fileName: string;
    relativePath?: string | null;
    targetDeviceId?: string | null;
    provider?: string;
  },
) {
  return apiFetch<JobResponse>("/api/downloader/jobs", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function heartbeatDevice(token: string, deviceId: string) {
  return apiFetch<{ ok: true; device: unknown }>("/api/downloader/devices/heartbeat", {
    method: "POST",
    token,
    body: JSON.stringify({ deviceId }),
  });
}
