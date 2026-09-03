import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { ZipProgressEvent } from "../download/zip-coordinator";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export type CreatePackZipRequest = {
  taskId: string;
  zipName: string;
  files: { absolutePath: string; archivePath: string }[];
};

export type CreatePackZipResult = {
  zipPath: string;
  fileCount: number;
  cancelled: boolean;
};

export async function createPackZip(request: CreatePackZipRequest): Promise<CreatePackZipResult> {
  if (!isTauriRuntime()) {
    throw new Error("Compactação ZIP disponível apenas no aplicativo desktop.");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<CreatePackZipResult>("create_pack_zip", { request });
}

export async function cancelPackZip(taskId: string): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<boolean>("cancel_pack_zip", { taskId });
}

export async function openZipFile(path: string): Promise<void> {
  if (!isTauriRuntime()) return;
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("open_zip_file", { path });
}

export function onZipProgress(listener: (event: ZipProgressEvent) => void) {
  if (!isTauriRuntime()) {
    return Promise.resolve(() => undefined);
  }

  let unlisten: UnlistenFn | undefined;
  return listen<ZipProgressEvent>("zip-progress", (payload) => {
    listener(payload.payload);
  }).then((fn) => {
    unlisten = fn;
    return () => {
      void unlisten?.();
    };
  });
}
