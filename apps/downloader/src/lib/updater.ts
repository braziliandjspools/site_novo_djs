import { APP_VERSION } from "./api/config";
import { apiFetch } from "./api/client";
import { compareSemver } from "./semver";
import { tRuntime } from "../i18n/runtime";
import { inAppNotificationFeed } from "./notifications/in-app-feed";
import { isDesktopRuntime } from "./native/app-preferences";
import { openPlatform } from "./open-site";
import { presentUpdateModalFromCheck } from "./update-modal";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export type LatestUpdateResponse = {
  updateAvailable: boolean;
  currentVersion: string;
  latest: {
    version: string;
    downloadUrl: string;
    notes: string;
    publishedAt: string | null;
    platform: string;
  } | null;
  message: string;
};

export type UpdateCheckResult = {
  checked: boolean;
  updateAvailable: boolean;
  message: string;
  latest: LatestUpdateResponse["latest"];
};

/** Sempre disponível: checa manifesto no site (env no Vercel). */
export function isUpdaterConfigured() {
  return true;
}

async function notifySystem(title: string, body: string) {
  if (!isDesktopRuntime()) return;
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    if (granted) sendNotification({ title, body });
  } catch {
    /* ignore */
  }
}

export async function checkForAppUpdates(options?: {
  silent?: boolean;
  notifyFeed?: boolean;
  /** Abre o popup centralizado quando houver update (login / verificar agora). */
  showModal?: boolean;
}): Promise<UpdateCheckResult> {
  const notifyFeed = options?.notifyFeed !== false;
  const showModal = options?.showModal !== false;
  try {
    const data = await apiFetch<LatestUpdateResponse>(
      `/api/downloader/updates/latest?current=${encodeURIComponent(APP_VERSION)}`,
      { method: "GET" },
    );

    if (data.updateAvailable && data.latest && notifyFeed) {
      const notes = data.latest.notes?.trim() || tRuntime("updaterDefaultBody");
      inAppNotificationFeed.push({
        kind: "update",
        severity: "info",
        title: tRuntime("updaterNewVersion", { version: data.latest.version }),
        body: notes,
        dedupeKey: `update:${data.latest.version}`,
        action: {
          type: "update",
          label: tRuntime("notificationsDownloadUpdate"),
          url: data.latest.downloadUrl,
        },
      });
      void notifySystem(
        tRuntime("notificationsUpdateSystemTitle", { version: data.latest.version }),
        tRuntime("notificationsUpdateSystemBody"),
      );
    }

    const result: UpdateCheckResult = {
      checked: true,
      updateAvailable: Boolean(data.updateAvailable && data.latest),
      message: data.message,
      latest: data.latest,
    };

    if (showModal) {
      presentUpdateModalFromCheck(result);
    }

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : tRuntime("notificationsUpdateCheckFailed");
    if (!options?.silent) {
      inAppNotificationFeed.push({
        kind: "info",
        severity: "warning",
        title: tRuntime("notificationsUpdateCheckFailed"),
        body: message,
        dedupeKey: "update-check-error",
      });
    }
    return {
      checked: false,
      updateAvailable: false,
      message,
      latest: null,
    };
  }
}

export async function openUpdateDownload(downloadUrl: string) {
  if (!isDesktopRuntime()) {
    await openPlatform(downloadUrl);
    return;
  }

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke<string>("download_and_launch_installer", { url: downloadUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Fallback: se a elevação falhar, abre o download no navegador para instalação manual.
    try {
      await openPlatform(downloadUrl);
    } catch {
      /* ignore */
    }
    inAppNotificationFeed.push({
      kind: "info",
      severity: "error",
      title: tRuntime("notificationsUpdateDownloadFailed"),
      body: message,
      dedupeKey: "update-download-error",
    });
    throw error instanceof Error ? error : new Error(message);
  }
}

export function isNewerThanInstalled(remoteVersion: string) {
  return compareSemver(remoteVersion, APP_VERSION) > 0;
}

export function canCheckUpdatesOnDesktop() {
  return isDesktopRuntime();
}

export { compareSemver };
