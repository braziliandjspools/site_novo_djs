import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type DownloadProgressEvent = {
  jobId: number;
  downloadedBytes: number;
  totalBytes: number | null;
  progress: number;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getDownloadDir() {
  if (!isTauriRuntime()) {
    return "Downloads/Brazilian Packs";
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("get_download_dir");
}

export async function getDefaultDownloadDir() {
  if (!isTauriRuntime()) {
    return "Downloads/Brazilian Packs";
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("get_default_download_dir_path");
}

export async function pickDownloadDir() {
  if (!isTauriRuntime()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string | null>("pick_download_dir");
}

export function onDownloadProgress(listener: (event: DownloadProgressEvent) => void) {
  if (!isTauriRuntime()) {
    return Promise.resolve(() => undefined);
  }

  let unlisten: UnlistenFn | undefined;
  return listen<DownloadProgressEvent>("download-progress", (payload) => {
    listener(payload.payload);
  }).then((fn) => {
    unlisten = fn;
    return () => {
      void unlisten?.();
    };
  });
}

export function isDesktopRuntime() {
  return isTauriRuntime();
}
