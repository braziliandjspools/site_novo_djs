import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { downloadManager } from "../lib/download/download-manager";
import { createRestQueueTransport } from "../lib/download/queue-transport";
import type { DownloadManagerSnapshot } from "../lib/download/types";
import { loadSessionToken } from "../lib/native/secure-store";
import type { DownloadJob } from "../lib/api/jobs";
import type { ConnectionState } from "../lib/download/types";

const EMPTY_SNAPSHOT: DownloadManagerSnapshot = {
  jobs: [],
  connectionState: "connecting",
  error: null,
  pendingCount: 0,
  activeJobId: null,
};

type DownloadManagerContextValue = {
  jobs: DownloadJob[];
  connectionState: ConnectionState;
  workerError: string | null;
  pendingCount: number;
  activeJobId: number | null;
  syncNow: () => void;
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

    void loadSessionToken().then((token) => {
      if (cancelled || !token) return;

      downloadManager.setTransport(createRestQueueTransport(token, device.deviceId), device.deviceId);
      downloadManager.start();
      unsubscribe = downloadManager.subscribe((next) => {
        if (!cancelled) setSnapshot(next);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      downloadManager.stop();
    };
  }, [status, device]);

  const value = useMemo<DownloadManagerContextValue>(
    () => ({
      jobs: snapshot.jobs,
      connectionState: snapshot.connectionState,
      workerError: snapshot.error,
      pendingCount: snapshot.pendingCount,
      activeJobId: snapshot.activeJobId,
      syncNow: () => downloadManager.syncNow(),
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
