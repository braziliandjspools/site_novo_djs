import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { downloadManager } from "../lib/download/download-manager";
import { notificationManager } from "../lib/notifications/notification-manager";
import { getAppPreferences, isDesktopRuntime, showMainWindow, updateTrayState } from "../lib/native/app-preferences";

export function useWindowsIntegration(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isDesktopRuntime()) return;

    let unlistenPause: (() => void) | undefined;

    void listen("tray-toggle-pause", () => {
      if (downloadManager.isGlobalPaused()) {
        downloadManager.resumeAllDownloads();
      } else {
        downloadManager.pauseAllDownloads();
      }
    }).then((fn) => {
      unlistenPause = fn;
    });

    return () => {
      unlistenPause?.();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isDesktopRuntime()) return;

    let lastActive = -1;
    let lastPaused: boolean | null = null;

    return downloadManager.subscribe((snapshot) => {
      if (
        snapshot.activeJobIds.length !== lastActive ||
        snapshot.globalPaused !== lastPaused
      ) {
        lastActive = snapshot.activeJobIds.length;
        lastPaused = snapshot.globalPaused;
        void updateTrayState(lastActive, lastPaused);
      }
      notificationManager.handleSnapshot(snapshot);
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isDesktopRuntime()) return;

    void getAppPreferences().then((prefs) => {
      downloadManager.setAutoDownload(prefs.autoDownload);
      downloadManager.setSchedulePreferences(prefs);
      notificationManager.setEnabled(prefs.showNotifications);
      notificationManager.resetKnownJobs(downloadManager.getSnapshot().jobs.map((job) => job.id));
    });
  }, [enabled]);
}

export function useTrayLaunchHandler() {
  useEffect(() => {
    if (!isDesktopRuntime()) return;
    void showMainWindow();
  }, []);
}
