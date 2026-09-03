export type DownloadDiskSpaceInfo = {
  availableBytes: number;
  driveRoot: string;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getDownloadDiskSpace(): Promise<DownloadDiskSpaceInfo> {
  if (!isTauriRuntime()) {
    return { availableBytes: 0, driveRoot: "" };
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<DownloadDiskSpaceInfo>("get_download_disk_space");
}
