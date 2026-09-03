import type { DownloadJob } from "../api/jobs";

/** Filtros de status da UI de busca (somente local). */
export type DownloadFinderFilter =
  | "all"
  | "downloading"
  | "queued"
  | "completed"
  | "failed"
  | "paused";

export type DownloadFinderCounts = {
  all: number;
  downloading: number;
  queued: number;
  completed: number;
  failed: number;
  paused: number;
};

export const FINDER_FILTER_ORDER: DownloadFinderFilter[] = [
  "all",
  "downloading",
  "queued",
  "completed",
  "failed",
  "paused",
];

export const FINDER_FILTER_LABELS: Record<DownloadFinderFilter, string> = {
  all: "Todos",
  downloading: "Baixando",
  queued: "Na fila",
  completed: "Concluídos",
  failed: "Falharam",
  paused: "Pausados",
};

/** Rótulos curtos nos contadores (ex.: "Fila 18"). */
export const FINDER_COUNT_LABELS: Record<DownloadFinderFilter, string> = {
  all: "Todos",
  downloading: "Baixando",
  queued: "Fila",
  completed: "Concluídos",
  failed: "Falharam",
  paused: "Pausados",
};

function normalizeQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function statusMatchesFilter(status: string, filter: DownloadFinderFilter): boolean {
  switch (filter) {
    case "all":
      return status !== "CANCELLED";
    case "downloading":
      return status === "DOWNLOADING";
    case "queued":
      return status === "PENDING" || status === "RECEIVED";
    case "completed":
      return status === "COMPLETED";
    case "failed":
      return status === "FAILED";
    case "paused":
      return status === "PAUSED";
    default:
      return false;
  }
}

function statusSearchText(status: string) {
  switch (status) {
    case "PENDING":
    case "RECEIVED":
      return "na fila queued pending received";
    case "DOWNLOADING":
      return "baixando downloading";
    case "PAUSED":
      return "pausado pausados paused";
    case "COMPLETED":
      return "concluido concluídos completed";
    case "FAILED":
      return "falhou falharam failed";
    case "CANCELLED":
      return "cancelado cancelled";
    default:
      return status.toLowerCase();
  }
}

/** Pasta / caminho relativo + trechos úteis para busca. */
function folderSearchText(job: DownloadJob) {
  const path = job.relativePath?.trim() ?? "";
  if (!path) return "";
  return path.replace(/[\\/]+/g, " ");
}

/** Categoria (provider) quando existir. */
function categorySearchText(job: DownloadJob) {
  const provider = job.provider?.trim() ?? "";
  if (!provider) return "";
  return provider.replace(/_/g, " ");
}

export function jobMatchesSearch(job: DownloadJob, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;

  const haystack = [
    job.fileName,
    folderSearchText(job),
    categorySearchText(job),
    statusSearchText(job.status),
    job.status,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function countFinderJobs(jobs: DownloadJob[]): DownloadFinderCounts {
  const counts: DownloadFinderCounts = {
    all: 0,
    downloading: 0,
    queued: 0,
    completed: 0,
    failed: 0,
    paused: 0,
  };

  for (const job of jobs) {
    if (job.status === "CANCELLED") continue;
    counts.all += 1;
    if (job.status === "DOWNLOADING") counts.downloading += 1;
    else if (job.status === "PENDING" || job.status === "RECEIVED") counts.queued += 1;
    else if (job.status === "COMPLETED") counts.completed += 1;
    else if (job.status === "FAILED") counts.failed += 1;
    else if (job.status === "PAUSED") counts.paused += 1;
  }

  return counts;
}

/**
 * Filtra localmente (sem rede). Contadores usam o conjunto já filtrado pela busca,
 * para os chips refletirem o resultado da pesquisa.
 */
export function filterFinderJobs(
  jobs: DownloadJob[],
  opts: { query: string; filter: DownloadFinderFilter },
): { visible: DownloadJob[]; counts: DownloadFinderCounts } {
  const searched = jobs.filter(
    (job) => job.status !== "CANCELLED" && jobMatchesSearch(job, opts.query),
  );
  const counts = countFinderJobs(searched);
  const visible =
    opts.filter === "all"
      ? searched
      : searched.filter((job) => statusMatchesFilter(job.status, opts.filter));
  return { visible, counts };
}

/** Une fila local + jobs do servidor; prioriza a versão do manager. */
export function mergeDownloadCatalog(
  managerJobs: DownloadJob[],
  serverJobs: DownloadJob[],
): DownloadJob[] {
  const byId = new Map<number, DownloadJob>();

  for (const job of serverJobs) {
    if (job.dismissedAt) continue;
    byId.set(job.id, job);
  }
  for (const job of managerJobs) {
    if (job.dismissedAt) continue;
    byId.set(job.id, job);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = Date.parse(a.updatedAt) || 0;
    const bTime = Date.parse(b.updatedAt) || 0;
    return bTime - aTime;
  });
}

/** Gera itens sintéticos para stress da UI (≥500). Só para testes / ?stress=500. */
export function buildStressCatalogJobs(count: number, seed = 1): DownloadJob[] {
  const statuses = ["DOWNLOADING", "PENDING", "RECEIVED", "COMPLETED", "FAILED", "PAUSED"] as const;
  const now = Date.now();
  const jobs: DownloadJob[] = [];

  for (let i = 0; i < count; i += 1) {
    const id = seed * 1_000_000 + i + 1;
    const status = statuses[i % statuses.length];
    const folder = `packs/estilo-${(i % 12) + 1}/semana-${(i % 4) + 1}`;
    jobs.push({
      id,
      provider: i % 5 === 0 ? "google_drive" : i % 5 === 1 ? "mega" : "local_pack",
      fileId: `stress-file-${id}`,
      fileName: `Track ${String(i + 1).padStart(4, "0")} - Brazilian Packs.mp3`,
      relativePath: `${folder}/track-${i + 1}.mp3`,
      targetDeviceId: null,
      fileSize: String(3_500_000 + (i % 50) * 10_000),
      mimeType: "audio/mpeg",
      status,
      progress: status === "COMPLETED" ? 100 : status === "DOWNLOADING" ? 35 + (i % 40) : 0,
      downloadedBytes: status === "COMPLETED" ? "3500000" : status === "DOWNLOADING" ? "1200000" : "0",
      totalBytes: "3500000",
      error: status === "FAILED" ? "Falha simulada de stress test." : null,
      deviceId: null,
      deviceName: null,
      claimedAt: null,
      startedAt: null,
      completedAt: status === "COMPLETED" ? new Date(now - i * 1000).toISOString() : null,
      dismissedAt: null,
      createdAt: new Date(now - i * 2000).toISOString(),
      updatedAt: new Date(now - i * 1000).toISOString(),
    });
  }

  return jobs;
}

export function canBulkPause(job: DownloadJob) {
  return job.status === "DOWNLOADING" || job.status === "RECEIVED" || job.status === "PENDING";
}

export function canBulkResume(job: DownloadJob) {
  return job.status === "PAUSED";
}

export function canBulkCancel(job: DownloadJob) {
  return ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"].includes(job.status);
}

export function canBulkRetry(job: DownloadJob) {
  return job.status === "FAILED";
}

export function canBulkDismiss(job: DownloadJob) {
  return ["COMPLETED", "FAILED", "CANCELLED"].includes(job.status);
}
