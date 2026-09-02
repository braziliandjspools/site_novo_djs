import { NetworkError } from "../api/client";
import { executeFileDownload } from "./file-download-executor";
import { loadPersistedQueue, persistQueue } from "./local-queue-store";
import {
  hasDownloadDirConfigured,
  isDesktopRuntime,
  onDownloadProgress,
  type DownloadProgressEvent,
} from "../native/download";
import { loadSessionToken } from "../native/secure-store";
import {
  CONNECT_BURST_MS,
  HEARTBEAT_MS,
  NEW_JOB_BURST_MS,
  POLL_MS,
  computePollDelayMs,
} from "./polling-schedule";
import { isClaimConflict } from "./queue-transport";
import type {
  ConnectionState,
  DownloadManagerListener,
  DownloadManagerSnapshot,
  QueueTransport,
} from "./types";
import { PROGRESS_SYNC_MS, QUEUE_STATUSES } from "./types";
import type { DownloadJob } from "../api/jobs";

function sortQueueJobs(jobs: DownloadJob[]) {
  const order: Record<string, number> = {
    DOWNLOADING: 0,
    RECEIVED: 1,
    PENDING: 2,
    PAUSED: 3,
    FAILED: 4,
    COMPLETED: 5,
  };

  return [...jobs].sort((a, b) => {
    const byStatus = (order[a.status] ?? 99) - (order[b.status] ?? 99);
    if (byStatus !== 0) return byStatus;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function isQueueJob(job: DownloadJob) {
  return QUEUE_STATUSES.has(job.status) || job.status === "COMPLETED";
}

function isActiveQueueJob(job: DownloadJob) {
  return ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED", "FAILED"].includes(job.status);
}

export class DownloadManager {
  private transport: QueueTransport | null = null;
  private deviceId: string | null = null;
  private jobs = new Map<number, DownloadJob>();
  private knownJobIds = new Set<number>();
  private listeners = new Set<DownloadManagerListener>();
  private connectionState: ConnectionState = "connecting";
  private error: string | null = null;
  private activeJobId: number | null = null;
  private burstUntil = 0;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private pollInFlight = false;
  private downloadInFlight = false;
  private lastProgressSync = new Map<number, number>();
  private progressCleanup: (() => void) | undefined;

  subscribe(listener: DownloadManagerListener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): DownloadManagerSnapshot {
    const jobs = sortQueueJobs(
      Array.from(this.jobs.values()).filter((job) => isActiveQueueJob(job) || job.status === "COMPLETED"),
    );
    const pendingCount = jobs.filter((job) =>
      ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status),
    ).length;

    return {
      jobs,
      connectionState: this.connectionState,
      error: this.error,
      pendingCount,
      activeJobId: this.activeJobId,
    };
  }

  setTransport(transport: QueueTransport, deviceId: string) {
    this.transport = transport;
    this.deviceId = deviceId;

    for (const job of loadPersistedQueue(deviceId)) {
      this.jobs.set(job.id, job);
      this.knownJobIds.add(job.id);
    }

    this.notify();
  }

  start() {
    if (this.running || !this.transport || !this.deviceId) return;
    this.running = true;
    this.connectionState = "connecting";
    this.burstUntil = Date.now() + CONNECT_BURST_MS;
    this.notify();

    void this.bindProgressListener();
    this.schedulePoll(POLL_MS.IMMEDIATE);
    this.heartbeatTimer = setInterval(() => {
      void this.sendHeartbeat();
    }, HEARTBEAT_MS);

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  stop() {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.progressCleanup?.();
    this.progressCleanup = undefined;
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  syncNow() {
    if (!this.running) return;
    this.schedulePoll(POLL_MS.IMMEDIATE);
  }

  private async bindProgressListener() {
    this.progressCleanup?.();
    this.progressCleanup = await onDownloadProgress((event) => {
      this.applyLocalProgress(event);
      void this.syncProgressThrottled(event.jobId, event);
    });
  }

  private applyLocalProgress(event: DownloadProgressEvent) {
    const current = this.jobs.get(event.jobId);
    if (!current) return;
    this.jobs.set(event.jobId, {
      ...current,
      progress: event.progress,
      downloadedBytes: String(event.downloadedBytes),
      totalBytes: event.totalBytes ? String(event.totalBytes) : current.totalBytes,
      status: "DOWNLOADING",
    });
    this.notify();
  }

  private async syncProgressThrottled(jobId: number, event: DownloadProgressEvent) {
    if (!this.transport) return;
    const now = Date.now();
    const last = this.lastProgressSync.get(jobId) ?? 0;
    if (now - last < PROGRESS_SYNC_MS && event.progress < 100) return;
    this.lastProgressSync.set(jobId, now);

    try {
      const updated = await this.transport.updateJob(jobId, {
        progress: event.progress,
        downloadedBytes: String(event.downloadedBytes),
        totalBytes: event.totalBytes ? String(event.totalBytes) : null,
      });
      this.mergeServerJob(updated);
      this.persistLocalQueue();
      this.notify();
    } catch {
      /* progresso permanece local */
    }
  }

  private handleOnline = () => {
    this.connectionState = "connecting";
    this.error = null;
    this.burstUntil = Date.now() + CONNECT_BURST_MS;
    this.notify();
    this.schedulePoll(POLL_MS.IMMEDIATE);
  };

  private handleOffline = () => {
    this.setOffline();
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && this.running) {
      this.schedulePoll(POLL_MS.IMMEDIATE);
    }
  };

  private setOffline() {
    this.connectionState = "offline";
    this.notify();
  }

  private setOnline() {
    if (this.connectionState !== "online") {
      this.connectionState = "online";
      this.error = null;
      this.notify();
    }
  }

  private notify() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private schedulePoll(delayMs: number) {
    if (!this.running) return;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(() => {
      void this.runPollCycle();
    }, delayMs);
  }

  private scheduleNextPoll() {
    if (!this.running) return;

    const snapshot = this.getSnapshot();
    const delay = computePollDelayMs({
      now: Date.now(),
      burstUntil: this.burstUntil,
      hasPendingJobs: snapshot.jobs.some((job) => job.status === "PENDING"),
      hasActiveDeviceJobs: snapshot.jobs.some(
        (job) =>
          job.deviceId === this.deviceId &&
          ["RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status),
      ),
      isDocumentVisible: typeof document === "undefined" || document.visibilityState === "visible",
      queueIsEmpty: snapshot.pendingCount === 0,
    });

    this.schedulePoll(delay);
  }

  private extendBurst(durationMs = NEW_JOB_BURST_MS) {
    this.burstUntil = Math.max(this.burstUntil, Date.now() + durationMs);
  }

  private mergeServerJob(job: DownloadJob) {
    const isNew = !this.knownJobIds.has(job.id);
    this.knownJobIds.add(job.id);

    if (isQueueJob(job)) {
      this.jobs.set(job.id, job);
      if (isNew && isActiveQueueJob(job)) this.extendBurst();
      return;
    }

    this.jobs.delete(job.id);
  }

  private persistLocalQueue() {
    if (!this.deviceId) return;
    persistQueue(this.deviceId, Array.from(this.jobs.values()));
  }

  private async sendHeartbeat() {
    if (!this.transport || this.connectionState === "offline") return;
    try {
      await this.transport.heartbeat();
      this.setOnline();
    } catch (error) {
      if (error instanceof NetworkError) {
        this.setOffline();
      }
    }
  }

  private pickNextReceivedJob() {
    return sortQueueJobs(Array.from(this.jobs.values())).find(
      (job) => job.status === "RECEIVED" && job.deviceId === this.deviceId,
    );
  }

  private async processNextDownload() {
    if (
      this.downloadInFlight ||
      !this.running ||
      !this.transport ||
      !this.deviceId ||
      !isDesktopRuntime() ||
      this.connectionState === "offline"
    ) {
      return;
    }

    const job = this.pickNextReceivedJob();
    if (!job) return;

    const folderReady = await hasDownloadDirConfigured();
    if (!folderReady) return;

    const token = await loadSessionToken();
    if (!token) return;

    this.downloadInFlight = true;
    this.activeJobId = job.id;
    this.notify();

    try {
      const downloading = await this.transport.updateJob(job.id, {
        status: "DOWNLOADING",
        progress: 0,
        downloadedBytes: "0",
        totalBytes: job.totalBytes ?? job.fileSize,
        error: null,
      });
      this.mergeServerJob(downloading);
      this.notify();

      const result = await executeFileDownload({
        provider: job.provider,
        fileId: job.fileId,
        fileName: job.fileName,
        relativePath: job.relativePath,
        authToken: token,
        jobId: job.id,
      });

      const completed = await this.transport.updateJob(job.id, {
        status: "COMPLETED",
        progress: 100,
        downloadedBytes: String(result.downloadedBytes),
        totalBytes: result.totalBytes ? String(result.totalBytes) : job.totalBytes ?? job.fileSize,
        error: null,
      });
      this.mergeServerJob(completed);
      this.jobs.delete(job.id);
      this.error = null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no download.";
      try {
        const failed = await this.transport.updateJob(job.id, {
          status: "FAILED",
          error: message,
        });
        this.mergeServerJob(failed);
      } catch {
        this.jobs.set(job.id, { ...job, status: "FAILED", error: message });
      }
      this.error = message;
    } finally {
      this.downloadInFlight = false;
      this.activeJobId = null;
      this.lastProgressSync.delete(job.id);
      this.persistLocalQueue();
      this.notify();
      void this.processNextDownload();
    }
  }

  private async runPollCycle() {
    if (!this.running || !this.transport || this.pollInFlight) {
      this.scheduleNextPoll();
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setOffline();
      this.scheduleNextPoll();
      return;
    }

    this.pollInFlight = true;

    try {
      const serverJobs = await this.transport.listJobs();
      this.setOnline();

      for (const job of serverJobs) {
        this.mergeServerJob(job);
      }

      const pendingJobs = serverJobs.filter((job) => job.status === "PENDING");
      for (const pending of pendingJobs) {
        try {
          const claimed = await this.transport.claimJob(pending.id);
          this.mergeServerJob(claimed);
        } catch (error) {
          if (isClaimConflict(error)) continue;
          throw error;
        }
      }

      this.persistLocalQueue();
      this.error = null;
      this.notify();
      void this.processNextDownload();
    } catch (error) {
      if (error instanceof NetworkError) {
        this.setOffline();
      } else {
        const message = error instanceof Error ? error.message : "Erro ao sincronizar a fila.";
        this.error = message;
        this.notify();
      }
    } finally {
      this.pollInFlight = false;
      this.scheduleNextPoll();
    }
  }
}

export const downloadManager = new DownloadManager();
