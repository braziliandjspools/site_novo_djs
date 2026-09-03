import { normalizeTimeInput } from "../download/download-schedule";

export type ExistingFileBehavior = "ignore" | "ask" | "replace" | "rename";

/** Presets de limite global (MB/s). `custom` usa `speedLimitCustomMbps`. */
export type SpeedLimitMode = "unlimited" | "1" | "2" | "5" | "10" | "20" | "custom";

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
  speedLimitMode: SpeedLimitMode;
  speedLimitCustomMbps: number;
  /** Baixar somente em determinados horários (local). */
  scheduleEnabled: boolean;
  /** Início da janela "HH:MM". */
  scheduleStart: string;
  /** Fim da janela "HH:MM" (exclusivo). */
  scheduleEnd: string;
  /** Downloads iniciados manualmente ignoram o horário. */
  scheduleAllowManualOverride: boolean;
  /** Após concluir os downloads de um pack/pasta, criar um ZIP (opcional). */
  zipCompressDownloads: boolean;
  /** Verificar novas versões do app no site e avisar no sininho. */
  checkAppUpdates: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  startWithWindows: false,
  minimizeToTray: true,
  autoDownload: true,
  showNotifications: true,
  downloadDir: null,
  maxConcurrentDownloads: 3,
  preserveFolderStructure: true,
  existingFileBehavior: "ignore",
  apiBaseUrl: null,
  speedLimitMode: "unlimited",
  speedLimitCustomMbps: 3,
  scheduleEnabled: false,
  scheduleStart: "00:00",
  scheduleEnd: "07:00",
  scheduleAllowManualOverride: true,
  zipCompressDownloads: false,
  checkAppUpdates: true,
};

const MB = 1024 * 1024;

export function resolveSpeedLimitBps(prefs: Pick<AppPreferences, "speedLimitMode" | "speedLimitCustomMbps">) {
  switch (prefs.speedLimitMode) {
    case "unlimited":
      return 0;
    case "1":
      return MB;
    case "2":
      return 2 * MB;
    case "5":
      return 5 * MB;
    case "10":
      return 10 * MB;
    case "20":
      return 20 * MB;
    case "custom": {
      const mbps = Number(prefs.speedLimitCustomMbps);
      if (!Number.isFinite(mbps) || mbps <= 0) return 0;
      return Math.round(mbps * MB);
    }
    default:
      return 0;
  }
}

function normalizePreferences(raw: Partial<AppPreferences> | null | undefined): AppPreferences {
  const merged = { ...DEFAULT_PREFERENCES, ...(raw ?? {}) };
  const mode = merged.speedLimitMode;
  const validModes: SpeedLimitMode[] = ["unlimited", "1", "2", "5", "10", "20", "custom"];
  if (!validModes.includes(mode)) {
    merged.speedLimitMode = "unlimited";
  }
  const custom = Number(merged.speedLimitCustomMbps);
  merged.speedLimitCustomMbps = Number.isFinite(custom) ? Math.min(1000, Math.max(0.1, custom)) : 3;
  merged.scheduleEnabled = Boolean(merged.scheduleEnabled);
  merged.scheduleAllowManualOverride = merged.scheduleAllowManualOverride !== false;
  merged.scheduleStart = normalizeTimeInput(String(merged.scheduleStart ?? "00:00"), "00:00");
  merged.scheduleEnd = normalizeTimeInput(String(merged.scheduleEnd ?? "07:00"), "07:00");
  merged.zipCompressDownloads = Boolean(merged.zipCompressDownloads);
  merged.checkAppUpdates = merged.checkAppUpdates !== false;
  return merged;
}

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getAppPreferences(): Promise<AppPreferences> {
  if (!isTauriRuntime()) return DEFAULT_PREFERENCES;
  const { invoke } = await import("@tauri-apps/api/core");
  const prefs = await invoke<AppPreferences>("get_app_preferences");
  return normalizePreferences(prefs);
}

export async function setAppPreferences(prefs: AppPreferences): Promise<AppPreferences> {
  if (!isTauriRuntime()) return normalizePreferences(prefs);
  const { invoke } = await import("@tauri-apps/api/core");
  const saved = await invoke<AppPreferences>("set_app_preferences", {
    prefs: normalizePreferences(prefs),
  });
  return normalizePreferences(saved);
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
