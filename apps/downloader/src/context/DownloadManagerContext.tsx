import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { downloadManager } from "../lib/download/download-manager";
import { createRestQueueTransport } from "../lib/download/queue-transport";
import type { DownloadManagerSnapshot, JobProgressMetrics, DiskSpaceSnapshot, ZipTask } from "../lib/download/types";
import type { DownloadJob } from "../lib/api/jobs";
import type { ConnectionState } from "../lib/download/types";

const EMPTY_SNAPSHOT: DownloadManagerSnapshot = {
  jobs: [],
  connectionState: "connecting",
  error: null,
  pendingCount: 0,
  activeJobIds: [],
  maxConcurrency: 3,
  globalPaused: false,
  autoDownload: true,
  jobMetrics: {},
  diskSpace: {
    availableBytes: null,
    queueBytes: 0,
    driveRoot: null,
    insufficientSpace: null,
  },
  zipTasks: [],
};

type DownloadManagerContextValue = {
  jobs: DownloadJob[];
  connectionState: ConnectionState;
  workerError: string | null;
  pendingCount: number;
  activeJobIds: number[];
  maxConcurrency: number;
  jobMetrics: Record<number, JobProgressMetrics>;
  diskSpace: DiskSpaceSnapshot;
  zipTasks: ZipTask[];
  syncNow: () => void;
  pauseJob: (jobId: number) => void;
  resumeJob: (jobId: number) => void;
  cancelJob: (jobId: number) => void;
  retryJob: (jobId: number) => void;
  dismissJob: (jobId: number) => void;
  pauseJobs: (jobIds: number[]) => void;
  resumeJobs: (jobIds: number[]) => void;
  cancelJobs: (jobIds: number[]) => void;
  retryJobs: (jobIds: number[]) => void;
  dismissJobs: (jobIds: number[]) => void;
  downloadNow: (jobId: number) => void;
  moveJobToTop: (jobId: number) => void;
  moveJobUp: (jobId: number) => void;
  moveJobDown: (jobId: number) => void;
  moveJobToEnd: (jobId: number) => void;
  reorderQueue: (orderedIds: number[]) => void;
  setMaxConcurrency: (value: number) => void;
  cancelZipTask: (taskId: string) => void;
  dismissZipTask: (taskId: string) => void;
  retryZipTask: (taskId: string) => void;
};

const DownloadManagerContext = createContext<DownloadManagerContextValue | null>(null);

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const { status, device, sessionToken } = useAuth();
  const [snapshot, setSnapshot] = useState<DownloadManagerSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (status !== "authenticated" || !device || !sessionToken) {
      downloadManager.stop(true);
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      await downloadManager.setTransport(
        createRestQueueTransport(sessionToken, device.deviceId),
        device.deviceId,
        sessionToken,
      );
      if (cancelled) return;
      unsubscribe = downloadManager.subscribe((next) => {
        if (!cancelled) setSnapshot(next);
      });
      downloadManager.start();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [status, device?.deviceId, sessionToken]);

  const actions = useMemo(
    () => ({
      syncNow: () => downloadManager.syncNow(),
      pauseJob: (jobId: number) => downloadManager.pauseJob(jobId),
      resumeJob: (jobId: number) => downloadManager.resumeJob(jobId),
      cancelJob: (jobId: number) => downloadManager.cancelJob(jobId),
      retryJob: (jobId: number) => downloadManager.retryJob(jobId),
      dismissJob: (jobId: number) => downloadManager.dismissJob(jobId),
      pauseJobs: (jobIds: number[]) => downloadManager.pauseJobs(jobIds),
      resumeJobs: (jobIds: number[]) => downloadManager.resumeJobs(jobIds),
      cancelJobs: (jobIds: number[]) => downloadManager.cancelJobs(jobIds),
      retryJobs: (jobIds: number[]) => downloadManager.retryJobs(jobIds),
      dismissJobs: (jobIds: number[]) => downloadManager.dismissJobs(jobIds),
      downloadNow: (jobId: number) => downloadManager.downloadNow(jobId),
      moveJobToTop: (jobId: number) => downloadManager.moveJobToTop(jobId),
      moveJobUp: (jobId: number) => downloadManager.moveJobUp(jobId),
      moveJobDown: (jobId: number) => downloadManager.moveJobDown(jobId),
      moveJobToEnd: (jobId: number) => downloadManager.moveJobToEnd(jobId),
      reorderQueue: (orderedIds: number[]) => downloadManager.reorderQueue(orderedIds),
      setMaxConcurrency: (value: number) => {
        void downloadManager.setMaxConcurrency(value);
      },
      cancelZipTask: (taskId: string) => downloadManager.cancelZipTask(taskId),
      dismissZipTask: (taskId: string) => downloadManager.dismissZipTask(taskId),
      retryZipTask: (taskId: string) => downloadManager.retryZipTask(taskId),
    }),
    [],
  );

  const value = useMemo<DownloadManagerContextValue>(
    () => ({
      jobs: snapshot.jobs,
      connectionState: snapshot.connectionState,
      workerError: snapshot.error,
      pendingCount: snapshot.pendingCount,
      activeJobIds: snapshot.activeJobIds,
      maxConcurrency: snapshot.maxConcurrency,
      jobMetrics: snapshot.jobMetrics,
      diskSpace: snapshot.diskSpace,
      zipTasks: snapshot.zipTasks,
      ...actions,
    }),
    [actions, snapshot],
  );

  return <DownloadManagerContext.Provider value={value}>{children}</DownloadManagerContext.Provider>;
}

export function useDownloadManager() {
  const context = useContext(DownloadManagerContext);
  if (!context) {
    throw new Error("useDownloadManager must be used within DownloadManagerProvider");
  }
  return context;
}
