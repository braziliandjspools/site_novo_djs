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

export async function hasDownloadDirConfigured() {
  if (!isTauriRuntime()) return true;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<boolean>("has_download_dir_configured");
}

export async function getDownloadDir() {
  if (!isTauriRuntime()) {
    return "Downloads/Brazilian Remix Service";
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("get_download_dir");
}

export async function getDefaultDownloadDir() {
  if (!isTauriRuntime()) {
    return "Downloads/Brazilian Remix Service";
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("get_default_download_dir_path");
}

export async function setDownloadDir(path: string) {
  if (!isTauriRuntime()) return path;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("set_download_dir", { path });
}

export async function pickDownloadDir() {
  if (!isTauriRuntime()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string | null>("pick_download_dir");
}

export async function openDownloadDir() {
  if (!isTauriRuntime()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("open_download_dir");
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

export async function getMaxConcurrentDownloads() {
  if (!isTauriRuntime()) return 3;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<number>("get_max_concurrent_downloads");
}

export async function setMaxConcurrentDownloads(value: number) {
  if (!isTauriRuntime()) return value;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<number>("set_max_concurrent_downloads", { value });
}

export async function cancelNativeDownload(input: {
  jobId: number;
  fileName: string;
  relativePath: string | null;
  deletePart: boolean;
}) {
  if (!isTauriRuntime()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("cancel_download_job", {
    jobId: input.jobId,
    fileName: input.fileName,
    relativePath: input.relativePath,
    deletePart: input.deletePart,
  });
}
