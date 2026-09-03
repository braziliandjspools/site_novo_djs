import { NetworkError, ApiError } from "../api/client";
import { executeFileDownload } from "./file-download-executor";
import { loadPersistedQueue, persistQueue } from "./local-queue-store";
import {
  loadQueueOrder,
  moveJobInOrder,
  moveJobRelative,
  persistQueueOrder,
} from "./local-queue-order";
import {
  cancelNativeDownload,
  getMaxConcurrentDownloads,
  hasDownloadDirConfigured,
  isDesktopRuntime,
  onDownloadProgress,
  setMaxConcurrentDownloads,
  type DownloadProgressEvent,
} from "../native/download";
import { cancelPackZip, createPackZip, onZipProgress } from "../native/zip";
import { loadSessionToken } from "../native/secure-store";
import {
  CONNECT_BURST_MS,
  HEARTBEAT_MS,
  NEW_JOB_BURST_MS,
  POLL_MS,
  computePollDelayMs,
} from "./polling-schedule";
import {
  isWithinDownloadWindow,
  msUntilNextScheduleBoundary,
  normalizeTimeInput,
} from "./download-schedule";
import { ProgressTracker } from "./progress-tracker";
import { nextRetryDelay, shouldAutoRetry, sleep } from "./retry-policy";
import { isClaimConflict, getClaimConflictJob } from "./queue-transport";
import {
  canStartJobDownload,
  estimateQueueBytes,
  isJobEligibleForQueueEstimate,
  resolveDiskSpaceError,
} from "./disk-space-utils";
import { getDownloadDiskSpace } from "../native/disk-space";
import type {
  ConnectionState,
  DownloadManagerListener,
  DownloadManagerSnapshot,
  QueueTransport,
} from "./types";
import { DEFAULT_MAX_CONCURRENCY, PROGRESS_SYNC_MS, PROGRESS_UI_MS, QUEUE_STATUSES } from "./types";
import type { DownloadJob } from "../api/jobs";
import type { AppPreferences } from "../native/app-preferences";
import { ZipCoordinator } from "./zip-coordinator";

function isQueueJob(job: DownloadJob) {
  return QUEUE_STATUSES.has(job.status) || job.status === "COMPLETED";
}

function isActiveQueueJob(job: DownloadJob) {
  return ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED", "FAILED"].includes(job.status);
}

function isReorderableJob(job: DownloadJob) {
  return ["PENDING", "RECEIVED", "PAUSED", "FAILED"].includes(job.status);
}

function parseBytes(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export class DownloadManager {
  private transport: QueueTransport | null = null;
  private deviceId: string | null = null;
  private authToken: string | null = null;
  private jobs = new Map<number, DownloadJob>();
  private knownJobIds = new Set<number>();
  /** Ordem local da fila (prioridade). Não sincroniza com o Neon. */
  private queueOrder: number[] = [];
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
  private lastProgressUi = 0;
  private progressUiTimer: ReturnType<typeof setTimeout> | null = null;
  private progressCleanup: (() => void) | undefined;
  private progressTracker = new ProgressTracker();
  private retryAttempts = new Map<number, number>();
  private userPausedJobIds = new Set<number>();
  private schedulePausedJobIds = new Set<number>();
  private slotPromises = new Map<number, Promise<void>>();
  private globalPaused = false;
  private autoDownload = true;
  private scheduleEnabled = false;
  private scheduleStart = "00:00";
  private scheduleEnd = "07:00";
  private scheduleAllowManualOverride = true;
  private scheduleInsideWindow = true;
  private scheduleTimer: ReturnType<typeof setTimeout> | null = null;
  private diskSpaceAvailable: number | null = null;
  private diskSpaceDriveRoot: string | null = null;
  private diskSpaceError: string | null = null;
  private diskSpaceRefreshInFlight = false;
  private diskSpaceTimer: ReturnType<typeof setInterval> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private lastNotifyKey = "";
  private zipProgressCleanup: (() => void) | undefined;
  private zipCoordinator = new ZipCoordinator({
    createZip: (request) => createPackZip(request),
    cancelZip: (taskId) => cancelPackZip(taskId),
    onChange: () => this.notify(true),
  });

  subscribe(listener: DownloadManagerListener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): DownloadManagerSnapshot {
    const jobs = this.sortJobsByLocalOrder(
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
      diskSpace: {
        availableBytes: this.diskSpaceAvailable,
        queueBytes: estimateQueueBytes(this.jobs.values(), this.deviceId ?? ""),
        driveRoot: this.diskSpaceDriveRoot,
        insufficientSpace: this.diskSpaceError,
      },
      zipTasks: this.zipCoordinator.listTasks(),
    };
  }

  async refreshDiskSpace() {
    if (!isDesktopRuntime()) return;

    if (this.diskSpaceRefreshInFlight) return;
    this.diskSpaceRefreshInFlight = true;

    try {
      const configured = await hasDownloadDirConfigured();
      if (!configured) {
        this.diskSpaceAvailable = null;
        this.diskSpaceDriveRoot = null;
        this.diskSpaceError = null;
        this.notify();
        return;
      }

      const info = await getDownloadDiskSpace();
      this.diskSpaceAvailable = info.availableBytes;
      this.diskSpaceDriveRoot = info.driveRoot;
      this.syncDiskSpaceError();
      this.notify();
    } catch (error) {
      this.diskSpaceAvailable = null;
      this.diskSpaceDriveRoot = null;
      this.diskSpaceError =
        error instanceof Error ? error.message : "Não foi possível ler o espaço em disco.";
      this.notify();
    } finally {
      this.diskSpaceRefreshInFlight = false;
    }
  }

  private syncDiskSpaceError() {
    const queueBytes = estimateQueueBytes(this.jobs.values(), this.deviceId ?? "");
    this.diskSpaceError = resolveDiskSpaceError(this.diskSpaceAvailable, queueBytes);
  }

  isGlobalPaused() {
    return this.globalPaused;
  }

  setAutoDownload(enabled: boolean) {
    this.autoDownload = enabled;
    this.notify();
    if (enabled) void this.processQueue(true);
  }

  setSchedulePreferences(
    prefs: Pick<
      AppPreferences,
      "scheduleEnabled" | "scheduleStart" | "scheduleEnd" | "scheduleAllowManualOverride"
    >,
  ) {
    this.scheduleEnabled = Boolean(prefs.scheduleEnabled);
    this.scheduleStart = normalizeTimeInput(prefs.scheduleStart, "00:00");
    this.scheduleEnd = normalizeTimeInput(prefs.scheduleEnd, "07:00");
    this.scheduleAllowManualOverride = prefs.scheduleAllowManualOverride !== false;
    this.evaluateScheduleWindow(true);
  }

  setZipCompressDownloads(enabled: boolean) {
    this.zipCoordinator.setEnabled(Boolean(enabled));
    this.notify();
  }

  cancelZipTask(taskId: string) {
    void this.zipCoordinator.cancelTask(taskId);
  }

  dismissZipTask(taskId: string) {
    this.zipCoordinator.dismissTask(taskId);
  }

  retryZipTask(taskId: string) {
    this.zipCoordinator.retryTask(taskId);
  }

  isInsideDownloadSchedule(now: Date = new Date()) {
    if (!this.scheduleEnabled) return true;
    return isWithinDownloadWindow(now, this.scheduleStart, this.scheduleEnd);
  }

  private isScheduleAllowingStarts(manualStart: boolean) {
    if (!this.scheduleEnabled) return true;
    if (this.isInsideDownloadSchedule()) return true;
    return manualStart && this.scheduleAllowManualOverride;
  }

  private clearScheduleTimer() {
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  private armScheduleTimer() {
    this.clearScheduleTimer();
    if (!this.scheduleEnabled || !this.running) return;
    const delay = msUntilNextScheduleBoundary(new Date(), this.scheduleStart, this.scheduleEnd);
    this.scheduleTimer = setTimeout(() => {
      this.scheduleTimer = null;
      this.evaluateScheduleWindow(true);
    }, delay);
  }

  private evaluateScheduleWindow(forceNotify = false) {
    const inside = this.isInsideDownloadSchedule();
    const changed = inside !== this.scheduleInsideWindow;
    this.scheduleInsideWindow = inside;

    if (this.scheduleEnabled && changed) {
      if (inside) {
        this.resumeSchedulePausedJobs();
        void this.processQueue();
      } else {
        this.pauseJobsForSchedule();
      }
    } else if (this.scheduleEnabled && !inside) {
      // Ainda fora: garante que ativos sejam pausados (ex.: config alterada).
      this.pauseJobsForSchedule();
    } else if (!this.scheduleEnabled && this.schedulePausedJobIds.size > 0) {
      this.resumeSchedulePausedJobs();
      void this.processQueue();
    }

    this.armScheduleTimer();
    if (forceNotify || changed) this.notify();
  }

  private pauseJobsForSchedule() {
    for (const job of this.jobs.values()) {
      if (!["DOWNLOADING", "RECEIVED"].includes(job.status)) continue;
      if (this.userPausedJobIds.has(job.id)) continue;
      this.schedulePausedJobIds.add(job.id);
      if (this.activeJobIds.has(job.id)) {
        void cancelNativeDownload({
          jobId: job.id,
          fileName: job.fileName,
          relativePath: job.relativePath,
          deletePart: false,
        });
      } else {
        void this.updateJobStatus(job.id, { status: "PAUSED", error: null });
      }
    }
  }

  private resumeSchedulePausedJobs() {
    const ids = [...this.schedulePausedJobIds];
    this.schedulePausedJobIds.clear();
    for (const jobId of ids) {
      if (this.userPausedJobIds.has(jobId)) continue;
      const job = this.jobs.get(jobId);
      if (!job || job.status !== "PAUSED") continue;
      void this.updateJobStatus(jobId, { status: "RECEIVED", error: null });
    }
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

  async setTransport(transport: QueueTransport, deviceId: string, authToken?: string | null) {
    this.transport = transport;
    this.deviceId = deviceId;
    this.authToken = authToken?.trim() || null;
    this.queueOrder = loadQueueOrder(deviceId);

    for (const job of loadPersistedQueue(deviceId)) {
      if (this.activeJobIds.has(job.id)) continue;
      this.jobs.set(job.id, job);
      this.knownJobIds.add(job.id);
      if (job.status === "PAUSED") {
        this.userPausedJobIds.add(job.id);
      }
    }

    this.syncQueueOrderWithJobs();

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
    if (!this.transport || !this.deviceId) return;

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    if (this.running) {
      void this.sendHeartbeat();
      this.schedulePoll(POLL_MS.IMMEDIATE);
      return;
    }

    this.running = true;
    this.connectionState = "online";
    this.error = null;
    this.burstUntil = Date.now() + CONNECT_BURST_MS;
    this.notify(true);
    this.evaluateScheduleWindow(true);

    void (async () => {
      await this.bindProgressListener();
      if (!this.running) return;
      void this.refreshDiskSpace();
      void this.sendHeartbeat();
      this.schedulePoll(POLL_MS.IMMEDIATE);
    })();

    this.heartbeatTimer = setInterval(() => {
      void this.sendHeartbeat();
    }, HEARTBEAT_MS);

    if (this.diskSpaceTimer) clearInterval(this.diskSpaceTimer);
    this.diskSpaceTimer = setInterval(() => {
      void this.refreshDiskSpace();
    }, 8_000);

    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  /** `immediate` no logout; caso contrário adia o halt (Strict Mode / HMR não mata o download). */
  stop(immediate = false) {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (!immediate) {
      this.stopTimer = setTimeout(() => {
        this.stopTimer = null;
        this.halt();
      }, 0);
      return;
    }
    this.halt();
  }

  private halt() {
    this.running = false;
    this.pollInFlight = false;
    this.authToken = null;
    this.clearScheduleTimer();
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.diskSpaceTimer) {
      clearInterval(this.diskSpaceTimer);
      this.diskSpaceTimer = null;
    }
    this.progressCleanup?.();
    this.progressCleanup = undefined;
    this.zipProgressCleanup?.();
    this.zipProgressCleanup = undefined;
    if (this.progressUiTimer) {
      clearTimeout(this.progressUiTimer);
      this.progressUiTimer = null;
    }
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

  /** Dispara sincronização e downloads após a pasta de destino ser configurada. */
  notifyFolderReady() {
    void this.refreshDiskSpace().then(() => {
      void this.processQueue(true);
    });
    this.syncNow();
  }

  pauseJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job || !["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status)) return;

    this.userPausedJobIds.add(jobId);
    this.schedulePausedJobIds.delete(jobId);
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
    this.schedulePausedJobIds.delete(jobId);
    void this.updateJobStatus(jobId, { status: "RECEIVED", error: null });
    void this.processQueue(true);
  }

  cancelJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    this.userPausedJobIds.delete(jobId);
    this.schedulePausedJobIds.delete(jobId);
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
    this.schedulePausedJobIds.delete(jobId);
    void this.retryJobRemote(jobId, true);
  }

  /** Torna o job a próxima prioridade possível e tenta iniciar (override de agenda). */
  downloadNow(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job || !isActiveQueueJob(job)) return;

    this.moveJobInQueueOrder(jobId, 0);

    if (job.status === "PAUSED") {
      this.resumeJob(jobId);
      return;
    }
    if (job.status === "FAILED") {
      this.retryJob(jobId);
      return;
    }

    this.notify(true);
    void this.processQueue(true);
  }

  moveJobToTop(jobId: number) {
    if (!this.canReorder(jobId)) return;
    this.moveJobInQueueOrder(jobId, 0);
    this.notify(true);
    void this.processQueue();
  }

  moveJobUp(jobId: number) {
    if (!this.canReorder(jobId)) return;
    this.queueOrder = moveJobRelative(this.queueOrder, jobId, -1);
    this.persistQueueOrderLocal();
    this.notify(true);
    void this.processQueue();
  }

  moveJobDown(jobId: number) {
    if (!this.canReorder(jobId)) return;
    this.queueOrder = moveJobRelative(this.queueOrder, jobId, 1);
    this.persistQueueOrderLocal();
    this.notify(true);
    void this.processQueue();
  }

  moveJobToEnd(jobId: number) {
    if (!this.canReorder(jobId)) return;
    this.moveJobInQueueOrder(jobId, this.queueOrder.length);
    this.notify(true);
    void this.processQueue();
  }

  /** Reordena a fila local a partir de uma lista de IDs (drag-and-drop). Sem escrita no Neon. */
  reorderQueue(orderedIds: number[]) {
    const activeIds = new Set(
      Array.from(this.jobs.values())
        .filter(isActiveQueueJob)
        .map((job) => job.id),
    );
    const normalized = orderedIds.filter((id) => activeIds.has(id));
    if (normalized.length === 0) return;

    const current = this.queueOrder.filter((id) => activeIds.has(id));
    const subset = new Set(normalized);

    let next: number[];
    if (normalized.length >= activeIds.size) {
      const seen = new Set(normalized);
      next = [...normalized];
      for (const id of current) {
        if (!seen.has(id)) next.push(id);
      }
    } else {
      const subsetIndices = current
        .map((id, index) => (subset.has(id) ? index : -1))
        .filter((index) => index >= 0);
      if (subsetIndices.length === normalized.length) {
        next = [...current];
        normalized.forEach((id, index) => {
          next[subsetIndices[index]] = id;
        });
      } else {
        next = [...normalized];
        const seen = new Set(normalized);
        for (const id of current) {
          if (!seen.has(id)) next.push(id);
        }
      }
    }

    for (const id of activeIds) {
      if (!next.includes(id)) next.push(id);
    }

    this.queueOrder = next;
    this.persistQueueOrderLocal();
    this.notify(true);
    void this.processQueue();
  }

  /** Remove falha/cancelado da fila local e marca dismiss no backend (status importante). */
  dismissJob(jobId: number) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    if (!["FAILED", "CANCELLED", "COMPLETED"].includes(job.status)) return;

    this.userPausedJobIds.delete(jobId);
    this.schedulePausedJobIds.delete(jobId);
    this.retryAttempts.delete(jobId);
    this.jobs.delete(jobId);
    this.removeFromQueueOrder(jobId);
    this.persistLocalQueue();
    this.notify(true);
    this.zipCoordinator.reevaluate(this.jobs.values());
    void this.dismissJobRemote(jobId);
  }

  /** Pausar vários jobs — sync com backend em uma requisição quando possível. */
  pauseJobs(jobIds: number[]) {
    const ids = [...new Set(jobIds)].filter((id) => {
      const job = this.jobs.get(id);
      return Boolean(job && ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status));
    });
    if (ids.length === 0) return;

    for (const jobId of ids) {
      const job = this.jobs.get(jobId);
      if (!job) continue;
      this.userPausedJobIds.add(jobId);
      this.schedulePausedJobIds.delete(jobId);
      if (this.activeJobIds.has(jobId)) {
        void cancelNativeDownload({
          jobId,
          fileName: job.fileName,
          relativePath: job.relativePath,
          deletePart: false,
        });
      } else {
        this.jobs.set(jobId, { ...job, status: "PAUSED", error: null });
      }
    }
    this.persistLocalQueue();
    this.notify(true);
    void this.runBatchAction("pause", ids);
  }

  resumeJobs(jobIds: number[]) {
    const ids = [...new Set(jobIds)].filter((id) => this.jobs.get(id)?.status === "PAUSED");
    if (ids.length === 0) return;

    for (const jobId of ids) {
      const job = this.jobs.get(jobId);
      if (!job) continue;
      this.userPausedJobIds.delete(jobId);
      this.schedulePausedJobIds.delete(jobId);
      this.jobs.set(jobId, { ...job, status: "RECEIVED", error: null });
    }
    this.persistLocalQueue();
    this.notify(true);
    void this.runBatchAction("resume", ids).then(() => {
      void this.processQueue(true);
    });
  }

  cancelJobs(jobIds: number[]) {
    const ids = [...new Set(jobIds)].filter((id) => {
      const job = this.jobs.get(id);
      return Boolean(job && ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status));
    });
    if (ids.length === 0) return;

    for (const jobId of ids) {
      const job = this.jobs.get(jobId);
      if (!job) continue;
      this.userPausedJobIds.delete(jobId);
      this.schedulePausedJobIds.delete(jobId);
      this.retryAttempts.delete(jobId);
      if (this.activeJobIds.has(jobId)) {
        void cancelNativeDownload({
          jobId,
          fileName: job.fileName,
          relativePath: job.relativePath,
          deletePart: true,
        });
      }
      this.jobs.delete(jobId);
      this.activeJobIds.delete(jobId);
      this.removeFromQueueOrder(jobId);
      this.progressTracker.clear(jobId);
      this.lastProgressSync.delete(jobId);
    }
    this.persistLocalQueue();
    this.notify(true);
    this.zipCoordinator.reevaluate(this.jobs.values());
    void this.runBatchAction("cancel", ids).then(() => {
      void this.processQueue();
    });
  }

  retryJobs(jobIds: number[]) {
    const unique = [...new Set(jobIds)];
    if (unique.length === 0) return;

    for (const jobId of unique) {
      const job = this.jobs.get(jobId);
      if (!job || job.status !== "FAILED") continue;
      this.retryAttempts.delete(jobId);
      this.userPausedJobIds.delete(jobId);
      this.schedulePausedJobIds.delete(jobId);
      this.jobs.set(jobId, {
        ...job,
        status: "PENDING",
        progress: 0,
        downloadedBytes: "0",
        error: null,
        deviceId: null,
        deviceName: null,
        claimedAt: null,
        startedAt: null,
        completedAt: null,
      });
    }
    this.persistLocalQueue();
    this.notify(true);
    void this.runBatchAction("retry", unique).then(() => {
      void this.processQueue(true);
    });
  }

  dismissJobs(jobIds: number[]) {
    const unique = [...new Set(jobIds)];
    if (unique.length === 0) return;

    for (const jobId of unique) {
      const job = this.jobs.get(jobId);
      if (!job || !["FAILED", "CANCELLED", "COMPLETED"].includes(job.status)) continue;
      this.userPausedJobIds.delete(jobId);
      this.schedulePausedJobIds.delete(jobId);
      this.retryAttempts.delete(jobId);
      this.jobs.delete(jobId);
      this.removeFromQueueOrder(jobId);
    }
    this.persistLocalQueue();
    this.notify(true);
    this.zipCoordinator.reevaluate(this.jobs.values());
    void this.runBatchAction("dismiss", unique);
  }

  private async runBatchAction(
    action: "pause" | "resume" | "cancel" | "retry" | "dismiss",
    jobIds: number[],
  ) {
    if (!this.transport || jobIds.length === 0) return;
    try {
      if (this.transport.batchActions) {
        await this.transport.batchActions(action, jobIds);
        return;
      }
      // Fallback: ainda evita sequência serial — Promise.all em paralelo.
      await Promise.all(
        jobIds.map(async (jobId) => {
          if (action === "pause") await this.transport!.updateJob(jobId, { status: "PAUSED", error: null });
          else if (action === "resume") {
            await this.transport!.updateJob(jobId, { status: "RECEIVED", error: null });
          } else if (action === "cancel") await this.transport!.cancelJob(jobId);
          else if (action === "retry") await this.transport!.retryJob(jobId);
          else await this.transport!.dismissJob(jobId);
        }),
      );
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Falha na ação em lote.";
      this.notify();
    }
  }

  private canReorder(jobId: number) {
    const job = this.jobs.get(jobId);
    return Boolean(job && isReorderableJob(job) && !this.activeJobIds.has(jobId));
  }

  private moveJobInQueueOrder(jobId: number, toIndex: number) {
    if (!this.queueOrder.includes(jobId)) {
      this.queueOrder = [...this.queueOrder, jobId];
    }
    this.queueOrder = moveJobInOrder(this.queueOrder, jobId, toIndex);
    this.persistQueueOrderLocal();
  }

  private removeFromQueueOrder(jobId: number) {
    const next = this.queueOrder.filter((id) => id !== jobId);
    if (next.length === this.queueOrder.length) return;
    this.queueOrder = next;
    this.persistQueueOrderLocal();
  }

  private persistQueueOrderLocal() {
    if (!this.deviceId) return;
    persistQueueOrder(this.deviceId, this.queueOrder);
  }

  private syncQueueOrderWithJobs() {
    const activeIds = new Set(
      Array.from(this.jobs.values())
        .filter(isActiveQueueJob)
        .map((job) => job.id),
    );
    const kept = this.queueOrder.filter((id) => activeIds.has(id));
    const keptSet = new Set(kept);
    for (const id of activeIds) {
      if (!keptSet.has(id)) kept.push(id);
    }
    const unchanged =
      kept.length === this.queueOrder.length && kept.every((id, index) => id === this.queueOrder[index]);
    if (unchanged) return;
    this.queueOrder = kept;
    this.persistQueueOrderLocal();
  }

  private sortJobsByLocalOrder(jobs: DownloadJob[]) {
    const index = new Map(this.queueOrder.map((id, i) => [id, i]));
    return [...jobs].sort((a, b) => {
      const aDownloading = a.status === "DOWNLOADING" || this.activeJobIds.has(a.id) ? 0 : 1;
      const bDownloading = b.status === "DOWNLOADING" || this.activeJobIds.has(b.id) ? 0 : 1;
      if (aDownloading !== bDownloading) return aDownloading - bDownloading;

      const ai = index.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bi = index.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      if (ai !== bi) return ai - bi;
      return a.id - b.id;
    });
  }

  private async bindProgressListener() {
    this.progressCleanup?.();
    this.progressCleanup = await onDownloadProgress((event) => {
      this.applyLocalProgress(event);
      void this.syncProgressThrottled(event.jobId, event);
    });

    this.zipProgressCleanup?.();
    this.zipProgressCleanup = await onZipProgress((event) => {
      this.zipCoordinator.applyProgress(event);
    });
  }

  private notifyZipAfterComplete(job: DownloadJob, absolutePath: string) {
    if (!this.zipCoordinator.isEnabled()) return;
    this.zipCoordinator.recordCompleted({
      jobId: job.id,
      fileName: job.fileName,
      relativePath: job.relativePath,
      absolutePath,
      activeJobs: this.jobs.values(),
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
      totalBytes: event.totalBytes
        ? String(event.totalBytes)
        : current.totalBytes ?? current.fileSize,
      status: "DOWNLOADING",
    });
    this.notifyProgressUi();
  }

  private notifyProgressUi() {
    const now = Date.now();
    const elapsed = now - this.lastProgressUi;
    if (elapsed >= PROGRESS_UI_MS) {
      this.lastProgressUi = now;
      this.notify();
      return;
    }
    if (this.progressUiTimer) return;
    this.progressUiTimer = setTimeout(() => {
      this.progressUiTimer = null;
      this.lastProgressUi = Date.now();
      this.notify();
    }, PROGRESS_UI_MS - elapsed);
  }

  private async syncProgressThrottled(jobId: number, event: DownloadProgressEvent) {
    if (!this.transport) return;
    const now = Date.now();
    const last = this.lastProgressSync.get(jobId) ?? 0;
    if (now - last < PROGRESS_SYNC_MS && event.progress < 100) return;
    this.lastProgressSync.set(jobId, now);

    try {
      await this.transport.updateJob(jobId, {
        progress: event.progress,
        downloadedBytes: String(event.downloadedBytes),
        totalBytes: event.totalBytes ? String(event.totalBytes) : null,
      });
      this.persistLocalQueue();
    } catch {
      /* progresso permanece local */
    }
  }

  private handleOnline = () => {
    this.error = null;
    this.burstUntil = Date.now() + CONNECT_BURST_MS;
    if (this.connectionState === "offline") {
      this.connectionState = "connecting";
      this.notify();
    }
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

  private notify(force = false) {
    const snapshot = this.getSnapshot();
    const key = this.snapshotKey(snapshot);
    if (!force && key === this.lastNotifyKey) return;
    this.lastNotifyKey = key;
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private snapshotKey(snapshot: DownloadManagerSnapshot) {
    const jobs = snapshot.jobs
      .map(
        (job) =>
          `${job.id}:${job.status}:${job.progress}:${job.downloadedBytes}:${job.error ?? ""}`,
      )
      .join("|");
    const zips = snapshot.zipTasks
      .map((task) => `${task.id}:${task.status}:${task.progress}:${task.done}:${task.error ?? ""}`)
      .join("|");
    return [
      snapshot.connectionState,
      snapshot.error ?? "",
      snapshot.activeJobIds.join(","),
      snapshot.diskSpace.availableBytes ?? "",
      snapshot.diskSpace.queueBytes,
      snapshot.diskSpace.insufficientSpace ?? "",
      snapshot.pendingCount,
      this.queueOrder.join(","),
      jobs,
      zips,
    ].join("/");
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
    const local = this.jobs.get(job.id);
    const inFlight = this.activeJobIds.has(job.id);

    if (inFlight && local) {
      this.jobs.set(job.id, {
        ...job,
        deviceId: local.deviceId ?? job.deviceId ?? this.deviceId,
        status:
          local.status === "DOWNLOADING" || local.status === "PAUSED" ? local.status : job.status,
        progress: Math.max(Number(local.progress) || 0, Number(job.progress) || 0),
        downloadedBytes:
          parseBytes(local.downloadedBytes) >= parseBytes(job.downloadedBytes)
            ? local.downloadedBytes
            : job.downloadedBytes,
        totalBytes: local.totalBytes || job.totalBytes,
        error: local.error,
      });
      return;
    }

    if (
      job.deviceId &&
      job.deviceId !== this.deviceId &&
      ["RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status)
    ) {
      if (!inFlight) this.jobs.delete(job.id);
      return;
    }

    const isNew = !this.knownJobIds.has(job.id);
    this.knownJobIds.add(job.id);

    if (local && local.status === "DOWNLOADING" && !["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) {
      this.jobs.set(job.id, {
        ...job,
        status: "DOWNLOADING",
        progress: Math.max(Number(local.progress) || 0, Number(job.progress) || 0),
        downloadedBytes:
          parseBytes(local.downloadedBytes) >= parseBytes(job.downloadedBytes)
            ? local.downloadedBytes
            : job.downloadedBytes,
        totalBytes: local.totalBytes || job.totalBytes,
        error: local.error,
      });
      if (isNew) this.extendBurst();
      return;
    }

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

  private isClaimablePending(job: DownloadJob) {
    return (
      job.status === "PENDING" &&
      (!job.targetDeviceId || job.targetDeviceId === this.deviceId)
    );
  }

  private async claimPendingJobs(serverJobs: DownloadJob[]) {
    if (!this.transport) return;

    const MAX_CLAIMS_PER_POLL = 40;
    const pendingIds = new Set<number>();
    for (const job of serverJobs) {
      if (this.isClaimablePending(job)) pendingIds.add(job.id);
    }
    for (const job of this.jobs.values()) {
      if (this.isClaimablePending(job)) pendingIds.add(job.id);
    }

    const orderedPending = this.sortJobsByLocalOrder(
      Array.from(pendingIds)
        .map((id) => this.jobs.get(id) ?? serverJobs.find((job) => job.id === id))
        .filter((job): job is DownloadJob => Boolean(job)),
    ).map((job) => job.id);

    for (const id of pendingIds) {
      if (!orderedPending.includes(id)) orderedPending.push(id);
    }

    let claimed = 0;
    for (const jobId of orderedPending) {
      if (claimed >= MAX_CLAIMS_PER_POLL) break;
      try {
        const next = await this.transport.claimJob(jobId);
        this.mergeServerJob(next);
        claimed += 1;
      } catch (error) {
        const conflictJob = getClaimConflictJob(error);
        if (conflictJob) {
          this.mergeServerJob(conflictJob);
          continue;
        }
        if (isClaimConflict(error)) continue;
        if (error instanceof ApiError && error.status === 404) {
          this.jobs.delete(jobId);
          this.removeFromQueueOrder(jobId);
          continue;
        }
        continue;
      }
    }
  }

  private persistLocalQueue() {
    if (!this.deviceId) return;
    this.syncQueueOrderWithJobs();
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
    return this.sortJobsByLocalOrder(Array.from(this.jobs.values()))
      .filter(
        (job) =>
          (job.status === "RECEIVED" || job.status === "DOWNLOADING") &&
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
      this.removeFromQueueOrder(jobId);
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

  private async dismissJobRemote(jobId: number) {
    if (!this.transport) return;
    try {
      await this.transport.dismissJob(jobId);
    } catch {
      /* já removido localmente */
    }
  }

  private async retryJobRemote(jobId: number, manualStart = false) {
    if (!this.transport) return;
    try {
      const updated = await this.transport.retryJob(jobId);
      this.mergeServerJob(updated);
      this.persistLocalQueue();
      this.notify();
      void this.processQueue(manualStart);
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Não foi possível reenviar.";
      this.notify();
    }
  }

  private async processQueue(manualStart = false) {
    if (this.globalPaused) return;
    if (!manualStart && !this.autoDownload) return;
    if (!this.isScheduleAllowingStarts(manualStart)) return;

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

    if (this.diskSpaceAvailable === null) {
      await this.refreshDiskSpace();
    } else {
      this.syncDiskSpaceError();
    }

    this.startAvailableJobs(manualStart);
  }

  private startAvailableJobs(manualStart = false) {
    if (this.globalPaused) return;
    if (!manualStart && !this.autoDownload) return;
    if (!this.isScheduleAllowingStarts(manualStart)) return;
    if (!this.running || this.connectionState === "offline") return;

    const availableSlots = this.maxConcurrency - this.activeJobIds.size;
    if (availableSlots <= 0) return;

    const jobs = this.pickNextReceivedJobs(availableSlots).filter((job) =>
      canStartJobDownload(
        this.diskSpaceAvailable,
        Math.max(parseBytes(job.fileSize), parseBytes(job.totalBytes)),
      ),
    );
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
      if (this.isScheduleAllowingStarts(false)) {
        this.startAvailableJobs();
      }
      this.notify();
      void this.refreshDiskSpace();
    });

    this.slotPromises.set(job.id, promise);
  }

  private async runDownload(initialJob: DownloadJob) {
    if (!this.transport) return;

    // Preferir token em memória (AuthContext). Keyring pode falhar e marcar o job como "sessão expirada".
    let token = this.authToken?.trim() || null;
    if (!token) {
      token = (await loadSessionToken())?.trim() || null;
      if (token) this.authToken = token;
    }
    if (!token) {
      await this.updateJobStatus(initialJob.id, {
        status: "FAILED",
        error: "Sessão expirada. Entre novamente.",
      });
      return;
    }

    let job = initialJob;

    while (true) {
      if (this.userPausedJobIds.has(job.id) || this.schedulePausedJobIds.has(job.id)) {
        await this.updateJobStatus(job.id, { status: "PAUSED", error: null });
        return;
      }

      if (!this.isScheduleAllowingStarts(false)) {
        this.schedulePausedJobIds.add(job.id);
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
        if (!job.totalBytes && job.fileSize) {
          job = { ...job, totalBytes: job.fileSize };
          this.jobs.set(job.id, job);
        }
        this.notify();

        const result = await executeFileDownload({
          provider: job.provider,
          fileId: job.fileId,
          fileName: job.fileName,
          relativePath: job.relativePath,
          authToken: token,
          jobId: job.id,
          fileSize: job.fileSize ? Number(job.fileSize) : null,
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
          this.notifyZipAfterComplete(job, result.path);
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
        this.notifyZipAfterComplete(job, result.path);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no download.";

        if (message.includes("cancelado") && (this.userPausedJobIds.has(job.id) || this.schedulePausedJobIds.has(job.id))) {
          await this.updateJobStatus(job.id, { status: "PAUSED", error: null });
          return;
        }

        if (message.includes("cancelado")) {
          this.zipCoordinator.reevaluate(this.jobs.values());
          return;
        }

        if (this.running && shouldAutoRetry(attempt)) {
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
          if (!this.running) return;
          if (!this.isScheduleAllowingStarts(false)) {
            this.schedulePausedJobIds.add(job.id);
            await this.updateJobStatus(job.id, { status: "PAUSED", error: null });
            return;
          }
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

      let addedSizedJobs = 0;
      for (const job of serverJobs) {
        const isNew = !this.knownJobIds.has(job.id);
        this.mergeServerJob(job);
        if (
          isNew &&
          this.deviceId &&
          parseBytes(job.fileSize) > 0 &&
          isJobEligibleForQueueEstimate(job, this.deviceId)
        ) {
          addedSizedJobs += 1;
        }
      }

      await this.claimPendingJobs(serverJobs);

      const hasUnclaimedPending = Array.from(this.jobs.values()).some((job) =>
        this.isClaimablePending(job),
      );
      if (hasUnclaimedPending) {
        this.extendBurst();
      }

      if (addedSizedJobs > 0) {
        void this.refreshDiskSpace();
      } else {
        this.syncDiskSpaceError();
      }

      this.persistLocalQueue();
      this.error = null;
      this.notify();
      void this.processQueue();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao sincronizar a fila.";
      this.error = message;
      if (error instanceof NetworkError) {
        this.setOffline();
      } else {
        this.notify();
      }
    } finally {
      this.pollInFlight = false;
      this.scheduleNextPoll();
    }
  }
}

export const downloadManager = new DownloadManager();
