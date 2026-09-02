import { invoke } from "@tauri-apps/api/core";

const DEV_SESSION_KEY = "bp_downloader_dev_session";
const DEV_DEVICE_ID_KEY = "bp_downloader_dev_device_id";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function readDevSession() {
  try {
    return sessionStorage.getItem(DEV_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeDevSession(token: string | null) {
  try {
    if (!token) sessionStorage.removeItem(DEV_SESSION_KEY);
    else sessionStorage.setItem(DEV_SESSION_KEY, token);
  } catch {
    /* ignore */
  }
}

export async function saveSessionToken(token: string) {
  if (isTauriRuntime()) {
    await invoke("save_session_token", { token });
    return;
  }
  writeDevSession(token);
}

export async function loadSessionToken() {
  if (isTauriRuntime()) {
    return invoke<string | null>("load_session_token");
  }
  return readDevSession();
}

export async function clearSessionToken() {
  if (isTauriRuntime()) {
    await invoke("clear_session_token");
    return;
  }
  writeDevSession(null);
}

export async function getOrCreateDeviceId() {
  if (isTauriRuntime()) {
    return invoke<string>("get_or_create_device_id");
  }

  let deviceId = localStorage.getItem(DEV_DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `bp-dev-${crypto.randomUUID().replace(/-/g, "")}`;
    localStorage.setItem(DEV_DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function getDeviceName() {
  if (isTauriRuntime()) {
    return invoke<string>("get_device_name");
  }
  return "Navegador (dev)";
}

export async function getPlatformName() {
  if (isTauriRuntime()) {
    return invoke<string>("get_platform_name");
  }

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "desktop";
}

export function formatPlatformLabel(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized === "windows") return "Windows";
  if (normalized === "macos") return "macOS";
  if (normalized === "linux") return "Linux";
  return platform;
}
