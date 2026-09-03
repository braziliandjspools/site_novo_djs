import { NetworkError } from "../api/client";
import { executeFileDownload } from "./file-download-executor";
import { loadPersistedQueue, persistQueue } from "./local-queue-store";
import {
  cancelNativeDownload,
  getMaxConcurrentDownloads,
  hasDownloadDirConfigured,
  isDesktopRuntime,
  onDownloadProgress,
  setMaxConcurrentDownloads,
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
import { ProgressTracker } from "./progress-tracker";
import { nextRetryDelay, shouldAutoRetry, sleep } from "./retry-policy";
import { isClaimConflict } from "./queue-transport";
import type {
  ConnectionState,
  DownloadManagerListener,
  DownloadManagerSnapshot,
  QueueTransport,
} from "./types";
import { DEFAULT_MAX_CONCURRENCY, PROGRESS_SYNC_MS, QUEUE_STATUSES } from "./types";
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

function parseBytes(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export class DownloadManager {
  private transport: QueueTransport | null = null;
  private deviceId: string | null = null;
  private jobs = new Map<number, DownloadJob>();
  private knownJobIds = new Set<number>();
  private listeners = new Set<DownloadManagerListener>();
  private connectionState: ConnectionState = "connecting";
  private error: string | null = null;
  private activeJobIds = new Set<number>();
  private maxConcurrency = DEFAULT_MAX_CONCURRENCY;
  private burstUntil = 0;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private pollInFlight = false;
  private lastProgressSync = new Map<number, number>();
  private progressCleanup: (() => void) | undefined;
  private progressTracker = new ProgressTracker();
  private retryAttempts = new Map<number, number>();
  private userPausedJobIds = new Set<number>();
  private slotPromises = new Map<number, Promise<void>>();
  private globalPaused = false;
  private autoDownload = true;

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

    const jobMetrics: DownloadManagerSnapshot["jobMetrics"] = {};
    for (const jobId of this.activeJobIds) {
      const job = this.jobs.get(jobId);
      if (!job) continue;
      jobMetrics[jobId] = this.progressTracker.metrics(jobId, parseBytes(job.totalBytes));
    }

    return {
      jobs,
      connectionState: this.connectionState,
      error: this.error,
      pendingCount,
      activeJobIds: Array.from(this.activeJobIds),
      maxConcurrency: this.maxConcurrency,
      globalPaused: this.globalPaused,
      autoDownload: this.autoDownload,
      jobMetrics,
    };
  }

  isGlobalPaused() {
    return this.globalPaused;
  }

  setAutoDownload(enabled: boolean) {
    this.autoDownload = enabled;
    this.notify();
    if (enabled) void this.processQueue(true);
  }

  pauseAllDownloads() {
    this.globalPaused = true;
    for (const job of this.jobs.values()) {
      if (job.status === "DOWNLOADING" || job.status === "RECEIVED") {
        this.pauseJob(job.id);
      }
    }
    this.notify();
  }

  resumeAllDownloads() {
    this.globalPaused = false;
    for (const job of [...this.jobs.values()]) {
      if (job.status === "PAUSED") {
        this.userPausedJobIds.delete(job.id);
        void this.updateJobStatus(job.id, { status: "RECEIVED", error: null });
      }
    }
    this.notify();
    void this.processQueue(true);
  }

  async setTransport(transport: QueueTransport, deviceId: string) {
    this.transport = transport;
    this.deviceId = deviceId;

    for (const job of loadPersistedQueue(deviceId)) {
      this.jobs.set(job.id, job);
      this.knownJobIds.add(job.id);
      if (job.status === "PAUSED") {
        this.userPausedJobIds.add(job.id);
      }
    }

    if (isDesktopRuntime()) {
      try {
        this.maxConcurrency = await getMaxConcurrentDownloads();
      } catch {
        this.maxConcurrency = DEFAULT_MAX_CONCURRENCY;
      }
    }
    this.notify();
    void this.processQueue();
  }

  async setMaxConcurrency(value: number) {
    const clamped = Math.min(5, Math.max(1, Math.round(value)));
    this.maxConcurrency = clamped;
    if (isDesktopRuntime()) {
      this.maxConcurrency = await setMaxConcurrentDownloads(clamped);
    }
    this.notify();
    void this.processQueue();
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

  pauseJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job || !["RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status)) return;

    this.userPausedJobIds.add(jobId);
    if (this.activeJobIds.has(jobId)) {
      void cancelNativeDownload({
        jobId,
        fileName: job.fileName,
        relativePath: job.relativePath,
        deletePart: false,
      });
    } else {
      void this.updateJobStatus(jobId, { status: "PAUSED" });
    }
  }

  resumeJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "PAUSED") return;
    this.userPausedJobIds.delete(jobId);
    void this.updateJobStatus(jobId, { status: "RECEIVED", error: null });
    void this.processQueue(true);
  }

  cancelJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    this.userPausedJobIds.delete(jobId);
    this.retryAttempts.delete(jobId);

    if (this.activeJobIds.has(jobId)) {
      void cancelNativeDownload({
        jobId,
        fileName: job.fileName,
        relativePath: job.relativePath,
        deletePart: true,
      });
    }

    void this.cancelJobRemote(jobId);
  }

  retryJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "FAILED") return;
    this.retryAttempts.delete(jobId);
    this.userPausedJobIds.delete(jobId);
    void this.retryJobRemote(jobId);
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
    this.progressTracker.record(event.jobId, event.downloadedBytes);
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
      if (job.status === "PAUSED") {
        this.userPausedJobIds.add(job.id);
      }
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

  private pickNextReceivedJobs(limit: number) {
    return sortQueueJobs(Array.from(this.jobs.values()))
      .filter(
        (job) =>
          job.status === "RECEIVED" &&
          job.deviceId === this.deviceId &&
          !this.userPausedJobIds.has(job.id) &&
          !this.activeJobIds.has(job.id),
      )
      .slice(0, limit);
  }

  private async updateJobStatus(
    jobId: number,
    payload: {
      status?: string;
      progress?: number;
      downloadedBytes?: string;
      totalBytes?: string | null;
      error?: string | null;
    },
  ) {
    if (!this.transport) return;
    try {
      const updated = await this.transport.updateJob(jobId, payload);
      this.mergeServerJob(updated);
      this.persistLocalQueue();
      this.notify();
    } catch {
      const current = this.jobs.get(jobId);
      if (current && payload.status) {
        this.jobs.set(jobId, { ...current, ...payload, status: payload.status });
        this.notify();
      }
    }
  }

  private async cancelJobRemote(jobId: number) {
    if (!this.transport) return;
    try {
      const updated = await this.transport.cancelJob(jobId);
      this.mergeServerJob(updated);
      this.jobs.delete(jobId);
      this.activeJobIds.delete(jobId);
      this.progressTracker.clear(jobId);
      this.lastProgressSync.delete(jobId);
      this.persistLocalQueue();
      this.notify();
      void this.processQueue();
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Não foi possível cancelar.";
      this.notify();
    }
  }

  private async retryJobRemote(jobId: number) {
    if (!this.transport) return;
    try {
      const updated = await this.transport.retryJob(jobId);
      this.mergeServerJob(updated);
      this.persistLocalQueue();
      this.notify();
      void this.processQueue();
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Não foi possível reenviar.";
      this.notify();
    }
  }

  private async processQueue(manualStart = false) {
    if (this.globalPaused) return;
    if (!manualStart && !this.autoDownload) return;

    if (
      !this.running ||
      !this.transport ||
      !this.deviceId ||
      !isDesktopRuntime() ||
      this.connectionState === "offline"
    ) {
      return;
    }

    const folderReady = await hasDownloadDirConfigured();
    if (!folderReady) return;

    const availableSlots = this.maxConcurrency - this.activeJobIds.size;
    if (availableSlots <= 0) return;

    const jobs = this.pickNextReceivedJobs(availableSlots);
    for (const job of jobs) {
      void this.startDownload(job);
    }
  }

  private async startDownload(job: DownloadJob) {
    if (this.activeJobIds.has(job.id)) return;

    this.activeJobIds.add(job.id);
    this.notify();

    const promise = this.runDownload(job).finally(() => {
      this.activeJobIds.delete(job.id);
      this.slotPromises.delete(job.id);
      this.progressTracker.clear(job.id);
      this.lastProgressSync.delete(job.id);
      this.persistLocalQueue();
      this.notify();
      void this.processQueue();
    });

    this.slotPromises.set(job.id, promise);
  }

  private async runDownload(initialJob: DownloadJob) {
    if (!this.transport) return;

    const token = await loadSessionToken();
    if (!token) return;

    let job = initialJob;

    while (this.running) {
      if (this.userPausedJobIds.has(job.id)) {
        await this.updateJobStatus(job.id, { status: "PAUSED", error: null });
        return;
      }

      const resumeBytes = parseBytes(job.downloadedBytes);
      const attempt = this.retryAttempts.get(job.id) ?? 0;

      try {
        const downloading = await this.transport.updateJob(job.id, {
          status: "DOWNLOADING",
          progress: resumeBytes > 0 ? job.progress : 0,
          downloadedBytes: String(resumeBytes),
          totalBytes: job.totalBytes ?? job.fileSize,
          error: null,
        });
        this.mergeServerJob(downloading);
        job = this.jobs.get(job.id) ?? downloading;
        this.notify();

        const result = await executeFileDownload({
          provider: job.provider,
          fileId: job.fileId,
          fileName: job.fileName,
          relativePath: job.relativePath,
          authToken: token,
          jobId: job.id,
        });

        this.retryAttempts.delete(job.id);

        if (result.skipped) {
          const completed = await this.transport.updateJob(job.id, {
            status: "COMPLETED",
            progress: 100,
            downloadedBytes: "0",
            totalBytes: job.totalBytes ?? job.fileSize,
            error: null,
          });
          this.mergeServerJob(completed);
          this.jobs.delete(job.id);
          this.error = null;
          return;
        }

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
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no download.";

        if (message.includes("cancelado") && this.userPausedJobIds.has(job.id)) {
          await this.updateJobStatus(job.id, { status: "PAUSED", error: null });
          return;
        }

        if (message.includes("cancelado")) {
          return;
        }

        if (shouldAutoRetry(attempt)) {
          const delay = nextRetryDelay(attempt)!;
          this.retryAttempts.set(job.id, attempt + 1);
          job = {
            ...(this.jobs.get(job.id) ?? job),
            status: "RECEIVED",
            error: `Tentativa ${attempt + 1} falhou. Reenviando em ${Math.round(delay / 1000)}s…`,
          };
          this.jobs.set(job.id, job);
          this.notify();
          await sleep(delay);
          job = this.jobs.get(job.id) ?? job;
          continue;
        }

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
        return;
      }
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

      const pendingJobs = serverJobs.filter(
        (job) =>
          job.status === "PENDING" &&
          (!job.targetDeviceId || job.targetDeviceId === this.deviceId),
      );
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
      void this.processQueue();
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
