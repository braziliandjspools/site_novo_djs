import { resolveDownloadProvider } from "./providers";
import type { FileDownloadRequest, FileDownloadResult } from "./providers/types";

export async function executeFileDownload(request: FileDownloadRequest): Promise<FileDownloadResult> {
  const provider = resolveDownloadProvider(request.provider);
  return provider.download(request);
}

export type { FileDownloadRequest, FileDownloadResult } from "./providers/types";
