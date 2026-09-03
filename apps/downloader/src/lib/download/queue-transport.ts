import { ApiError } from "../api/client";
import {
  claimJob as apiClaimJob,
  cancelJob as apiCancelJob,
  heartbeatDevice,
  listJobs,
  retryJob as apiRetryJob,
  updateJob as apiUpdateJob,
  type DownloadJob,
} from "../api/jobs";
import type { QueueTransport } from "./types";

/** Produção ainda valida limit ≤ 200; 500 gera 400 e a sync nunca conclui. */
const QUEUE_LIST_LIMIT = 200;

export function createRestQueueTransport(token: string, deviceId: string): QueueTransport {
  return {
    async listJobs(): Promise<DownloadJob[]> {
      try {
        const response = await listJobs(token, { deviceId, queue: true, limit: QUEUE_LIST_LIMIT });
        return response.jobs;
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          const fallback = await listJobs(token, { deviceId, queue: true, limit: 50 });
          return fallback.jobs;
        }
        throw error;
      }
    },

    async claimJob(jobId: number): Promise<DownloadJob> {
      const response = await apiClaimJob(token, jobId, deviceId);
      return response.job;
    },

    async updateJob(jobId, payload) {
      const response = await apiUpdateJob(token, jobId, { ...payload, deviceId });
      return response.job;
    },

    async cancelJob(jobId: number) {
      const response = await apiCancelJob(token, jobId);
      return response.job;
    },

    async retryJob(jobId: number) {
      const response = await apiRetryJob(token, jobId);
      return response.job;
    },

    async heartbeat(): Promise<void> {
      await heartbeatDevice(token, deviceId);
    },
  };
}

export function isClaimConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

export function getClaimConflictJob(error: unknown): DownloadJob | null {
  if (!isClaimConflict(error)) return null;
  const payload = (error as ApiError).payload as { job?: DownloadJob } | undefined;
  return payload?.job ?? null;
}
