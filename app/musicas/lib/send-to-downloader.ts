import { ensureAudioExtension, type PreviewTrack } from "../../lib/google-drive";
import type { DownloaderDeviceSummary, SendTarget } from "./downloader-sync";

export type DownloaderJobPayload = {
  fileId: string;
  fileName: string;
  relativePath?: string;
  targetDeviceId?: string;
  provider: "google_drive";
};

const BATCH_CHUNK_SIZE = 100;

export function buildDownloaderJobPayload(
  track: PreviewTrack,
  relativePath?: string,
  targetDeviceId?: string,
): DownloaderJobPayload {
  const payload: DownloaderJobPayload = {
    fileId: track.id,
    fileName: ensureAudioExtension(track.fileName ?? track.title),
    provider: "google_drive",
  };

  if (relativePath?.trim()) {
    payload.relativePath = relativePath.trim();
  }
  if (targetDeviceId) {
    payload.targetDeviceId = targetDeviceId;
  }

  return payload;
}

export function resolveTargetDeviceIds(
  target: SendTarget | null | undefined,
  devices: DownloaderDeviceSummary[],
): string[] {
  const online = devices.filter((device) => device.isOnline);

  // Um único PC online: não fixa targetDeviceId — qualquer sessão desse app pode puxar a fila.
  if (!target || target === "all") {
    if (online.length <= 1) return [];
    return online.map((device) => device.deviceId);
  }

  // Seleção explícita do único PC online também fica sem target fixo (evita fila órfã se o deviceId mudar).
  if (online.length === 1 && online[0]?.deviceId === target) {
    return [];
  }

  return [target];
}

function buildJobsForSend(
  tracks: PreviewTrack[],
  relativePath: string | undefined,
  targetDeviceIds: string[],
) {
  if (targetDeviceIds.length === 0) {
    return tracks.map((track) => buildDownloaderJobPayload(track, relativePath));
  }

  const jobs: DownloaderJobPayload[] = [];
  for (const track of tracks) {
    for (const targetDeviceId of targetDeviceIds) {
      jobs.push(buildDownloaderJobPayload(track, relativePath, targetDeviceId));
    }
  }
  return jobs;
}

type TracksPageResponse = {
  tracks: PreviewTrack[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
};

type SendOptions = {
  relativePath?: string;
  target?: SendTarget | null;
  devices?: DownloaderDeviceSummary[];
};

async function parseDownloaderResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { error?: string; count?: number };
  if (!response.ok) {
    throw new Error(data.error ?? "Não foi possível enviar para o Downloader.");
  }
  return data;
}

async function postJobBatch(jobs: DownloaderJobPayload[]) {
  let totalCount = 0;
  for (let offset = 0; offset < jobs.length; offset += BATCH_CHUNK_SIZE) {
    const chunk = jobs.slice(offset, offset + BATCH_CHUNK_SIZE);
    const response = await fetch("/api/downloader/jobs/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ jobs: chunk }),
    });
    const data = await parseDownloaderResponse(response);
    totalCount += data.count ?? chunk.length;
  }
  return { count: totalCount };
}

export async function sendTrackToDownloader(track: PreviewTrack, options: SendOptions = {}) {
  const targetDeviceIds = resolveTargetDeviceIds(options.target, options.devices ?? []);
  const jobs = buildJobsForSend([track], options.relativePath, targetDeviceIds);

  if (jobs.length === 1) {
    const response = await fetch("/api/downloader/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(jobs[0]),
    });
    await parseDownloaderResponse(response);
    return { count: 1 };
  }

  return postJobBatch(jobs);
}

export async function fetchAllFolderTracks(folderId: string, folderName: string) {
  const tracks: PreviewTrack[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      folderId,
      folderName,
      page: String(page),
      limit: "50",
    });
    const response = await fetch(`/api/musicas/tracks?${params.toString()}`, { cache: "no-store" });
    const data = (await response.json()) as TracksPageResponse;
    if (!response.ok) {
      throw new Error(data.error ?? "Erro ao carregar faixas da pasta.");
    }

    tracks.push(...data.tracks);
    hasMore = data.hasMore;
    page += 1;
  }

  return tracks;
}

export async function sendTracksToDownloaderBatch(tracks: PreviewTrack[], options: SendOptions = {}) {
  if (tracks.length === 0) {
    throw new Error("Nenhuma faixa selecionada.");
  }

  const targetDeviceIds = resolveTargetDeviceIds(options.target, options.devices ?? []);
  const jobs = buildJobsForSend(tracks, options.relativePath, targetDeviceIds);
  return postJobBatch(jobs);
}

export async function sendFolderToDownloader(input: {
  folderId: string;
  folderName: string;
  relativePath?: string;
  target?: SendTarget | null;
  devices?: DownloaderDeviceSummary[];
}) {
  const tracks = await fetchAllFolderTracks(input.folderId, input.folderName);
  if (tracks.length === 0) {
    throw new Error("Esta pasta não possui faixas para enviar.");
  }
  return sendTracksToDownloaderBatch(tracks, input);
}

/**
 * Envia pasta recursiva (mês/semana/estilo) preservando relativePath
 * via /api/downloader/pack/import — adequado para mês inteiro.
 */
export async function sendPackSlugToDownloader(
  slug: string,
  options: Omit<SendOptions, "relativePath"> = {},
) {
  const normalized = slug.replace(/^\/+|\/+$/g, "").trim();
  if (!normalized) {
    throw new Error("Slug da pasta inválido.");
  }

  const targetDeviceIds = resolveTargetDeviceIds(options.target, options.devices ?? []);
  const targets = targetDeviceIds.length > 0 ? targetDeviceIds : [null];

  let totalCount = 0;
  let folderName: string | undefined;
  let relativePath: string | undefined;

  for (const targetDeviceId of targets) {
    const response = await fetch("/api/downloader/pack/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        slug: normalized,
        ...(targetDeviceId ? { targetDeviceId } : {}),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      count?: number;
      folderName?: string;
      relativePath?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Não foi possível enviar a pasta para o Downloader.");
    }
    totalCount += data.count ?? 0;
    folderName = data.folderName ?? folderName;
    relativePath = data.relativePath ?? relativePath;
  }

  return { count: totalCount, folderName, relativePath };
}
