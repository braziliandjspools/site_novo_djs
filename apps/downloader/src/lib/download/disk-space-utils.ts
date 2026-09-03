import type { DownloadJob } from "../api/jobs";

/** Margem de segurança para não encher a unidade completamente (512 MB). */
export const DISK_SAFETY_MARGIN_BYTES = 512 * 1024 * 1024;

export type DiskSpaceSnapshot = {
  availableBytes: number | null;
  queueBytes: number;
  driveRoot: string | null;
  insufficientSpace: string | null;
};

export function formatDiskSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unitIndex]}`;
}

function parseJobBytes(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Bytes totais conhecidos do arquivo (fileSize ou totalBytes). */
export function jobKnownTotalBytes(job: DownloadJob): number {
  return Math.max(parseJobBytes(job.fileSize), parseJobBytes(job.totalBytes));
}

/** Bytes ainda a baixar (resta da fila / download). */
export function jobRemainingBytes(job: DownloadJob): number {
  const total = jobKnownTotalBytes(job);
  if (total <= 0) return 0;
  const downloaded = parseJobBytes(job.downloadedBytes);
  return Math.max(0, total - downloaded);
}

export function isJobEligibleForQueueEstimate(job: DownloadJob, deviceId: string) {
  if (job.status === "PENDING") {
    return !job.targetDeviceId || job.targetDeviceId === deviceId;
  }
  if (["RECEIVED", "FAILED", "PAUSED", "DOWNLOADING"].includes(job.status)) {
    return !deviceId || !job.deviceId || job.deviceId === deviceId;
  }
  return false;
}

/** Soma o restante a baixar dos itens da fila com tamanho conhecido. */
export function estimateQueueBytes(jobs: Iterable<DownloadJob>, deviceId: string): number {
  let total = 0;
  for (const job of jobs) {
    if (!isJobEligibleForQueueEstimate(job, deviceId)) continue;
    total += jobRemainingBytes(job);
  }
  return total;
}

export function canFitBytes(availableBytes: number, neededBytes: number) {
  return availableBytes >= neededBytes + DISK_SAFETY_MARGIN_BYTES;
}

export function hasSpaceForQueue(availableBytes: number | null, queueBytes: number) {
  if (availableBytes === null) return true;
  if (queueBytes <= 0) return true;
  return canFitBytes(availableBytes, queueBytes);
}

export function canStartJobDownload(availableBytes: number | null, jobSizeBytes: number) {
  if (availableBytes === null) return true;
  if (jobSizeBytes <= 0) return true;
  return canFitBytes(availableBytes, jobSizeBytes);
}

export const DISK_SPACE_INSUFFICIENT_MESSAGE =
  "Não há espaço suficiente para concluir estes downloads.";

export function resolveDiskSpaceError(
  availableBytes: number | null,
  queueBytes: number,
): string | null {
  if (!hasSpaceForQueue(availableBytes, queueBytes)) {
    return DISK_SPACE_INSUFFICIENT_MESSAGE;
  }
  return null;
}
