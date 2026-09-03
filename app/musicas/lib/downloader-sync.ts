export type DownloaderDeviceSummary = {
  deviceId: string;
  deviceName: string;
  platform: string;
  isOnline: boolean;
  queueCount: number;
  lastSeenAt: string | null;
};

export type DownloaderJobSummary = {
  id: number;
  fileId: string;
  fileName: string;
  status: string;
  progress: number;
  error: string | null;
  deviceId: string | null;
  deviceName: string | null;
  targetDeviceId: string | null;
  relativePath: string | null;
  updatedAt: string;
};

export type DownloaderSyncState = {
  devices: DownloaderDeviceSummary[];
  totalQueueCount: number;
  jobsByFileId: Record<string, DownloaderJobSummary>;
};

export type SendTarget = string | "all";

export function getTrackDownloadLabel(job: DownloaderJobSummary | undefined) {
  if (!job) return null;

  switch (job.status) {
    case "PENDING":
      return "Na fila";
    case "RECEIVED":
      return job.deviceName ? `Enviado para ${job.deviceName}` : "Enviado para PC";
    case "DOWNLOADING":
      return `${Math.max(job.progress, 1)}%`;
    case "PAUSED":
      return "Pausado";
    case "COMPLETED":
      return "Concluído";
    case "FAILED":
      return "Falhou";
    default:
      return null;
  }
}

export function getTrackDownloadTone(status: string | undefined) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "FAILED":
      return "error";
    case "DOWNLOADING":
      return "active";
    case "RECEIVED":
    case "PENDING":
      return "pending";
    default:
      return "muted";
  }
}

export async function fetchDownloaderSync(): Promise<DownloaderSyncState> {
  const response = await fetch("/api/downloader/sync", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await response.json()) as DownloaderSyncState & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Não foi possível sincronizar o Downloader.");
  }
  return {
    devices: data.devices ?? [],
    totalQueueCount: data.totalQueueCount ?? 0,
    jobsByFileId: data.jobsByFileId ?? {},
  };
}
