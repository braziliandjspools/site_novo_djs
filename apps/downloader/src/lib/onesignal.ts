import OneSignal from "react-onesignal";
import { resolveApiBaseUrl } from "./api/config";
import { isDesktopRuntime } from "./native/download";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

const VERIFY_KEY = "bp_downloader_onesignal_ready";

let initPromise: Promise<boolean> | null = null;
let configured = false;

export function isDownloaderOneSignalConfigured() {
  return configured;
}

async function fetchAppId(): Promise<string | null> {
  try {
    const base = await resolveApiBaseUrl();
    const res = await fetch(`${base}/api/onesignal/config`, { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as { appId?: string | null; configured?: boolean };
    const id = data.appId?.trim() ?? "";
    return id || null;
  } catch {
    return null;
  }
}

async function bridgeToNativeNotification(title: string, body?: string) {
  if (!isDesktopRuntime()) return;
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const perm = await requestPermission();
      granted = perm === "granted";
    }
    if (granted) {
      sendNotification({ title, body: body ?? "" });
    }
  } catch {
    /* ignore */
  }
}

/**
 * OneSignal no Downloader (Tauri):
 * - Busca App ID no site (mesmo do Web).
 * - Liga a conta VIP via login(email).
 * - Em WebView2 o push remoto é limitado; notificações em foreground
 *   são espelhadas para o plugin nativo do Windows.
 */
export async function initDownloaderOneSignal(): Promise<boolean> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const appId = await fetchAppId();
    if (!appId) {
      configured = false;
      return false;
    }

    try {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
      });

      OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
        try {
          const notif = event as {
            notification?: { title?: string; body?: string };
            preventDefault?: () => void;
          };
          notif.preventDefault?.();
          const title = notif.notification?.title ?? "BRS Downloader";
          const body = notif.notification?.body ?? "";
          void bridgeToNativeNotification(title, body);
        } catch {
          /* ignore */
        }
      });

      configured = true;
      return true;
    } catch (error) {
      console.warn("[OneSignal] init downloader failed", error);
      configured = false;
      return false;
    }
  })();

  return initPromise;
}

export async function linkOneSignalUser(email: string | null | undefined) {
  const ok = await initDownloaderOneSignal();
  if (!ok || !email?.trim()) return;
  try {
    await OneSignal.login(email.trim().toLowerCase());
  } catch (error) {
    console.warn("[OneSignal] login failed", error);
  }
}

export async function unlinkOneSignalUser() {
  if (!configured) return;
  try {
    await OneSignal.logout();
  } catch {
    /* ignore */
  }
}

export async function requestOneSignalPush(): Promise<boolean> {
  const ok = await initDownloaderOneSignal();
  if (!ok) return false;
  try {
    await OneSignal.Notifications.requestPermission();
    if (!OneSignal.User.PushSubscription.optedIn) {
      await OneSignal.User.PushSubscription.optIn();
    }
    // Também pede permissão nativa Windows.
    await bridgeToNativeNotification("BRS Downloader", "Notificações ativadas.");
    return Boolean(OneSignal.User.PushSubscription.optedIn);
  } catch {
    return false;
  }
}

export async function optOutOneSignalPush() {
  if (!configured) return;
  try {
    await OneSignal.User.PushSubscription.optOut();
  } catch {
    /* ignore */
  }
}

export function oneSignalPushState(): "unavailable" | "subscribed" | "unsubscribed" | "denied" {
  if (!configured) return "unavailable";
  try {
    const permission = OneSignal.Notifications.permissionNative;
    if (permission === "denied") return "denied";
    if (OneSignal.User.PushSubscription.optedIn) return "subscribed";
    return "unsubscribed";
  } catch {
    return "unavailable";
  }
}

export function markOneSignalVerifySeen() {
  try {
    localStorage.setItem(VERIFY_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function shouldShowOneSignalVerify() {
  try {
    return configured && localStorage.getItem(VERIFY_KEY) !== "1";
  } catch {
    return false;
  }
}
