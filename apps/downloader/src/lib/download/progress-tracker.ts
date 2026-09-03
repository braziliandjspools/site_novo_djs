export type JobProgressMetrics = {
  speedBytesPerSec: number;
  etaSeconds: number | null;
};

type Sample = {
  at: number;
  bytes: number;
};

const WINDOW_MS = 5_000;

export class ProgressTracker {
  private samples = new Map<number, Sample[]>();

  record(jobId: number, downloadedBytes: number) {
    const now = Date.now();
    const list = this.samples.get(jobId) ?? [];
    list.push({ at: now, bytes: downloadedBytes });
    const cutoff = now - WINDOW_MS;
    while (list.length > 1 && list[0].at < cutoff) {
      list.shift();
    }
    this.samples.set(jobId, list);
  }

  metrics(jobId: number, totalBytes: number | null): JobProgressMetrics {
    const list = this.samples.get(jobId) ?? [];
    if (list.length < 2) {
      return { speedBytesPerSec: 0, etaSeconds: null };
    }

    const first = list[0];
    const last = list[list.length - 1];
    const elapsedMs = Math.max(last.at - first.at, 1);
    const deltaBytes = Math.max(last.bytes - first.bytes, 0);
    const speedBytesPerSec = (deltaBytes * 1000) / elapsedMs;

    if (!totalBytes || totalBytes <= last.bytes || speedBytesPerSec <= 0) {
      return { speedBytesPerSec, etaSeconds: null };
    }

    const remaining = totalBytes - last.bytes;
    return {
      speedBytesPerSec,
      etaSeconds: Math.max(1, Math.round(remaining / speedBytesPerSec)),
    };
  }

  clear(jobId: number) {
    this.samples.delete(jobId);
  }
}

export function formatBytes(value: number | string | null | undefined) {
  const bytes = typeof value === "string" ? Number(value) : value;
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSpeed(bytesPerSec: number) {
  if (!bytesPerSec || !Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return "—";
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

export function formatEta(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${seconds} segundo${seconds === 1 ? "" : "s"} restante${seconds === 1 ? "" : "s"}`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (rest === 0) return `${minutes} min restante${minutes === 1 ? "" : "s"}`;
  return `${minutes} min ${rest}s restantes`;
}
