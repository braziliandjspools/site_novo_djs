import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { tRuntime } from "../../i18n/runtime";
import type { DownloadManagerSnapshot } from "../download/types";
import { isDesktopRuntime } from "../native/app-preferences";
import { inAppNotificationFeed } from "./in-app-feed";

const BATCH_MS = 4_000;

type PendingBatch = {
  timer: ReturnType<typeof setTimeout> | null;
  count: number;
  lastTitle: string;
};

export class NotificationManager {
  private enabled = true;
  private knownJobIds = new Set<number>();
  private previousStatuses = new Map<number, string>();
  private newJobsBatch: PendingBatch = { timer: null, count: 0, lastTitle: "" };
  private completedBatch: PendingBatch = { timer: null, count: 0, lastTitle: "" };
  private failedBatch: PendingBatch = { timer: null, count: 0, lastTitle: "" };
  private permissionChecked = false;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  resetKnownJobs(jobIds: number[]) {
    for (const id of jobIds) {
      this.knownJobIds.add(id);
    }
  }

  handleSnapshot(snapshot: DownloadManagerSnapshot) {
    if (!this.enabled || !isDesktopRuntime()) return;

    void this.ensurePermission();

    for (const job of snapshot.jobs) {
      const prevStatus = this.previousStatuses.get(job.id);
      this.previousStatuses.set(job.id, job.status);

      const isNew = !this.knownJobIds.has(job.id);
      if (isNew) {
        this.knownJobIds.add(job.id);
        if (["PENDING", "RECEIVED", "DOWNLOADING"].includes(job.status)) {
          this.queueNewJob(job.fileName);
        }
      }

      if (prevStatus && prevStatus !== job.status) {
        if (job.status === "COMPLETED") {
          this.queueCompleted(job.fileName);
        }
        if (job.status === "FAILED") {
          this.queueFailed(job.fileName);
        }
      }
    }
  }

  private async ensurePermission() {
    if (this.permissionChecked) return;
    this.permissionChecked = true;
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
  }

  private queueNewJob(fileName: string) {
    this.enqueueBatch(this.newJobsBatch, fileName, () => {
      if (this.newJobsBatch.count === 1) {
        void this.notify(tRuntime("notificationsNewTrackReceived"), this.newJobsBatch.lastTitle, "info");
      } else {
        void this.notify(
          tRuntime("notificationsNewTracksReceived"),
          tRuntime("notificationsNewTracksBody", { count: this.newJobsBatch.count }),
          "info",
        );
      }
    });
  }

  private queueCompleted(fileName: string) {
    this.enqueueBatch(this.completedBatch, fileName, () => {
      if (this.completedBatch.count === 1) {
        void this.notify(tRuntime("notificationsDownloadComplete"), this.completedBatch.lastTitle, "success");
      } else {
        void this.notify(
          tRuntime("notificationsDownloadsComplete"),
          tRuntime("notificationsDownloadsCompleteBody", { count: this.completedBatch.count }),
          "success",
        );
      }
    });
  }

  private queueFailed(fileName: string) {
    this.enqueueBatch(this.failedBatch, fileName, () => {
      if (this.failedBatch.count === 1) {
        void this.notify(tRuntime("notificationsDownloadFailedFile"), this.failedBatch.lastTitle, "error");
      } else {
        void this.notify(
          tRuntime("notificationsDownloadsFailed"),
          tRuntime("notificationsDownloadsFailedBody", { count: this.failedBatch.count }),
          "error",
        );
      }
    });
  }

  private enqueueBatch(batch: PendingBatch, title: string, flush: () => void) {
    batch.count += 1;
    batch.lastTitle = title;
    if (batch.timer) clearTimeout(batch.timer);
    batch.timer = setTimeout(() => {
      flush();
      batch.count = 0;
      batch.lastTitle = "";
      batch.timer = null;
    }, BATCH_MS);
  }

  private async notify(
    title: string,
    body: string,
    severity: "info" | "success" | "warning" | "error",
  ) {
    if (!this.enabled) return;

    inAppNotificationFeed.push({
      kind: "download",
      severity,
      title,
      body,
    });

    try {
      sendNotification({ title, body });
    } catch {
      /* notificações do sistema indisponíveis */
    }
  }
}

export const notificationManager = new NotificationManager();
