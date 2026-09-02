import { ApiError } from "../api/client";
import {
  claimJob as apiClaimJob,
  heartbeatDevice,
  listJobs,
  updateJob as apiUpdateJob,
  type DownloadJob,
} from "../api/jobs";
import type { QueueTransport } from "./types";

export function createRestQueueTransport(token: string, deviceId: string): QueueTransport {
  return {
    async listJobs(): Promise<DownloadJob[]> {
      const response = await listJobs(token, { limit: 100 });
      return response.jobs;
    },

    async claimJob(jobId: number): Promise<DownloadJob> {
      const response = await apiClaimJob(token, jobId, deviceId);
      return response.job;
    },

    async updateJob(jobId, payload) {
      const response = await apiUpdateJob(token, jobId, { ...payload, deviceId });
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
