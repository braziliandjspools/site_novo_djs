export type DownloadProviderId = "google_drive" | "cloudflare_r2" | "s3";

export type FileDownloadRequest = {
  provider: string;
  fileId: string;
  fileName: string;
  relativePath: string | null;
  authToken: string;
  jobId: number;
  fileSize: number | null;
};

export type FileDownloadResult = {
  path: string;
  downloadedBytes: number;
  totalBytes: number | null;
  skipped?: boolean;
};

/** Contrato comum — implementações delegam ao Rust/Tauri. */
export interface DownloadProvider {
  readonly id: DownloadProviderId;
  download(request: FileDownloadRequest): Promise<FileDownloadResult>;
}

export function normalizeProviderId(provider: string): DownloadProviderId {
  const value = provider.trim().toLowerCase().replace(/-/g, "_");
  if (value === "google_drive") return "google_drive";
  if (value === "cloudflare_r2") return "cloudflare_r2";
  if (value === "s3") return "s3";
  return "google_drive";
}
