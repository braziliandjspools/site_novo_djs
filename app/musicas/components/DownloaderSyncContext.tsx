"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchDownloaderSync,
  type DownloaderJobSummary,
  type DownloaderSyncState,
  type SendTarget,
} from "../lib/downloader-sync";
import { useMusicasSession } from "./MusicasSessionContext";

type DownloaderSyncContextValue = {
  loading: boolean;
  error: string | null;
  devices: DownloaderSyncState["devices"];
  totalQueueCount: number;
  jobsByFileId: Record<string, DownloaderJobSummary>;
  selectedTarget: SendTarget | null;
  setSelectedTarget: (target: SendTarget | null) => void;
  refresh: () => Promise<void>;
  getJobForTrack: (fileId: string) => DownloaderJobSummary | undefined;
};

const DownloaderSyncContext = createContext<DownloaderSyncContextValue | null>(null);

const POLL_MS = 5000;

export function DownloaderSyncProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, hasVip } = useMusicasSession();
  const enabled = authenticated && hasVip;
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [sync, setSync] = useState<DownloaderSyncState>({
    devices: [],
    totalQueueCount: 0,
    jobsByFileId: {},
  });
  const [selectedTarget, setSelectedTarget] = useState<SendTarget | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const next = await fetchDownloaderSync();
      setSync(next);
      setError(null);
      setSelectedTarget((current) => {
        if (current && current !== "all") {
          const stillExists = next.devices.some((device) => device.deviceId === current);
          if (stillExists) return current;
        }
        const online = next.devices.filter((device) => device.isOnline);
        if (online.length === 1) return online[0]!.deviceId;
        if (online.length > 1) return current ?? "all";
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSync({ devices: [], totalQueueCount: 0, jobsByFileId: {} });
      setLoading(false);
      setSelectedTarget(null);
      return;
    }

    setLoading(true);
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  const value = useMemo<DownloaderSyncContextValue>(
    () => ({
      loading,
      error,
      devices: sync.devices,
      totalQueueCount: sync.totalQueueCount,
      jobsByFileId: sync.jobsByFileId,
      selectedTarget,
      setSelectedTarget,
      refresh,
      getJobForTrack: (fileId) => sync.jobsByFileId[fileId],
    }),
    [loading, error, refresh, selectedTarget, sync],
  );

  return <DownloaderSyncContext.Provider value={value}>{children}</DownloaderSyncContext.Provider>;
}

export function useDownloaderSync() {
  return useContext(DownloaderSyncContext);
}
