import { invoke } from "@tauri-apps/api/core";
import { API_BASE_URL } from "../../api/config";
import type { DownloadProvider, FileDownloadRequest, FileDownloadResult } from "./types";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invokeProviderDownload(request: FileDownloadRequest): Promise<FileDownloadResult> {
  if (!isTauriRuntime()) {
    throw new Error("Downloads reais exigem o aplicativo desktop Tauri.");
  }

  const result = await invoke<{
    path: string;
    downloadedBytes: number;
    totalBytes: number | null;
  }>("download_job_file", {
    apiBaseUrl: API_BASE_URL,
    provider: request.provider,
    fileId: request.fileId,
    fileName: request.fileName,
    relativePath: request.relativePath,
    authToken: request.authToken,
    jobId: request.jobId,
  });

  return {
    path: result.path,
    downloadedBytes: result.downloadedBytes,
    totalBytes: result.totalBytes,
  };
}

export class GoogleDriveProvider implements DownloadProvider {
  readonly id = "google_drive" as const;

  download(request: FileDownloadRequest) {
    return invokeProviderDownload({ ...request, provider: this.id });
  }
}

/** Placeholder — será implementado quando arquivos migrarem para R2. */
export class CloudflareR2Provider implements DownloadProvider {
  readonly id = "cloudflare_r2" as const;

  download(request: FileDownloadRequest) {
    return invokeProviderDownload({ ...request, provider: this.id });
  }
}

/** Placeholder — será implementado quando arquivos migrarem para S3. */
export class S3Provider implements DownloadProvider {
  readonly id = "s3" as const;

  download(request: FileDownloadRequest) {
    return invokeProviderDownload({ ...request, provider: this.id });
  }
}

const googleDriveProvider = new GoogleDriveProvider();
const cloudflareR2Provider = new CloudflareR2Provider();
const s3Provider = new S3Provider();

export function resolveDownloadProvider(provider: string): DownloadProvider {
  const id = provider.trim().toLowerCase().replace(/-/g, "_");
  switch (id) {
    case "cloudflare_r2":
      return cloudflareR2Provider;
    case "s3":
      return s3Provider;
    case "google_drive":
    default:
      return googleDriveProvider;
  }
}
