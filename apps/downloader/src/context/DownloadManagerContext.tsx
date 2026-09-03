import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { downloadManager } from "../lib/download/download-manager";
import { createRestQueueTransport } from "../lib/download/queue-transport";
import type { DownloadManagerSnapshot, JobProgressMetrics, DiskSpaceSnapshot } from "../lib/download/types";
import { loadSessionToken } from "../lib/native/secure-store";
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
  syncNow: () => void;
  pauseJob: (jobId: number) => void;
  resumeJob: (jobId: number) => void;
  cancelJob: (jobId: number) => void;
  retryJob: (jobId: number) => void;
  setMaxConcurrency: (value: number) => void;
};

const DownloadManagerContext = createContext<DownloadManagerContextValue | null>(null);

export function DownloadManagerProvider({ children }: { children: React.ReactNode }) {
  const { status, device } = useAuth();
  const [snapshot, setSnapshot] = useState<DownloadManagerSnapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (status !== "authenticated" || !device) {
      downloadManager.stop();
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void loadSessionToken().then(async (token) => {
      if (cancelled || !token) return;

      await downloadManager.setTransport(createRestQueueTransport(token, device.deviceId), device.deviceId);
      unsubscribe = downloadManager.subscribe((next) => {
        if (!cancelled) setSnapshot(next);
      });
      downloadManager.start();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      downloadManager.stop();
    };
  }, [status, device?.deviceId]);

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
      syncNow: () => downloadManager.syncNow(),
      pauseJob: (jobId) => downloadManager.pauseJob(jobId),
      resumeJob: (jobId) => downloadManager.resumeJob(jobId),
      cancelJob: (jobId) => downloadManager.cancelJob(jobId),
      retryJob: (jobId) => downloadManager.retryJob(jobId),
      setMaxConcurrency: (value) => {
        void downloadManager.setMaxConcurrency(value);
      },
    }),
    [snapshot],
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
