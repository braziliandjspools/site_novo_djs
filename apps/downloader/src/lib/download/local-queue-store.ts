import type { DownloadJob } from "../api/jobs";
import { QUEUE_STATUSES } from "./types";

const STORAGE_PREFIX = "bp-downloader-queue:";

function storageKey(deviceId: string) {
  return `${STORAGE_PREFIX}${deviceId}`;
}

export function loadPersistedQueue(deviceId: string): DownloadJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(deviceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DownloadJob[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((job) => QUEUE_STATUSES.has(job.status));
  } catch {
    return [];
  }
}

export function persistQueue(deviceId: string, jobs: DownloadJob[]) {
  if (typeof window === "undefined") return;
  const queueJobs = jobs.filter((job) => QUEUE_STATUSES.has(job.status));
  try {
    window.localStorage.setItem(storageKey(deviceId), JSON.stringify(queueJobs));
  } catch {
    /* quota ou modo privado */
  }
}

export function clearPersistedQueue(deviceId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(deviceId));
}
