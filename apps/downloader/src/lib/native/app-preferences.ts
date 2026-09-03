export type ExistingFileBehavior = "ignore" | "ask" | "replace" | "rename";

export type AppPreferences = {
  startWithWindows: boolean;
  minimizeToTray: boolean;
  autoDownload: boolean;
  showNotifications: boolean;
  downloadDir: string | null;
  maxConcurrentDownloads: number;
  preserveFolderStructure: boolean;
  existingFileBehavior: ExistingFileBehavior;
  apiBaseUrl: string | null;
};

const DEFAULT_PREFERENCES: AppPreferences = {
  startWithWindows: false,
  minimizeToTray: true,
  autoDownload: true,
  showNotifications: true,
  downloadDir: null,
  maxConcurrentDownloads: 3,
  preserveFolderStructure: true,
  existingFileBehavior: "ignore",
  apiBaseUrl: null,
};
function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getAppPreferences(): Promise<AppPreferences> {
  if (!isTauriRuntime()) return DEFAULT_PREFERENCES;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<AppPreferences>("get_app_preferences");
}

export async function setAppPreferences(prefs: AppPreferences): Promise<AppPreferences> {
  if (!isTauriRuntime()) return prefs;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<AppPreferences>("set_app_preferences", { prefs });
}

export async function updateTrayState(activeCount: number, paused: boolean) {
  if (!isTauriRuntime()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("update_tray_state", { activeCount, paused });
}

export async function showMainWindow() {
  if (!isTauriRuntime()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("show_main_window_command");
}

export function isDesktopRuntime() {
  return isTauriRuntime();
}
