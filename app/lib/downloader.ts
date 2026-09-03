import type { DownloadDevice, DownloadJob, DownloadJobProvider, DownloadJobStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { sanitizeDriveFilename } from "./google-drive";

const DRIVE_FILE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const DEVICE_ID_REGEX = /^[a-zA-Z0-9._-]{8,128}$/;
const MAX_BATCH_JOBS = 500;
const BATCH_CHUNK_SIZE = 100;
const MAX_LIST_JOBS = 500;
const MAX_FILE_NAME_LENGTH = 512;
const MAX_RELATIVE_PATH_LENGTH = 1024;
const MAX_DEVICE_NAME_LENGTH = 120;
const MAX_PLATFORM_LENGTH = 64;
const MAX_APP_VERSION_LENGTH = 32;
const MAX_ERROR_LENGTH = 2000;

const JOB_STATUSES: DownloadJobStatus[] = [
  "PENDING",
  "RECEIVED",
  "DOWNLOADING",
  "PAUSED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

const CANCELLABLE_STATUSES: DownloadJobStatus[] = ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"];
const ACTIVE_QUEUE_STATUSES: DownloadJobStatus[] = ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"];
export const DEVICE_ONLINE_MS = 120_000;

export type DownloadJobInput = {
  fileId: string;
  fileName: string;
  relativePath?: string | null;
  targetDeviceId?: string | null;
  fileSize?: string | number | bigint | null;
  mimeType?: string | null;
  provider?: DownloadJobProvider;
};

export type DownloadJobUpdateInput = {
  status?: DownloadJobStatus;
  progress?: number;
  downloadedBytes?: string | number | bigint;
  totalBytes?: string | number | bigint | null;
  error?: string | null;
  deviceId?: string;
};

export function parseDriveFileId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !DRIVE_FILE_ID_REGEX.test(trimmed)) return null;
  return trimmed;
}

export function parseExternalDeviceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!DEVICE_ID_REGEX.test(trimmed)) return null;
  return trimmed;
}

function parseOptionalString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

function parseFileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const sanitized = sanitizeDriveFilename(value.trim());
  if (!sanitized || sanitized.length > MAX_FILE_NAME_LENGTH) return null;
  return sanitized;
}

function parseBigIntInput(value: unknown): bigint | null {
  if (value === undefined || value === null) return null;
  try {
    if (typeof value === "bigint") return value >= BigInt(0) ? value : null;
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0) return null;
      return BigInt(value);
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return BigInt(value.trim());
    }
  } catch {
    return null;
  }
  return null;
}

function parseProgress(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > 100) return null;
  return value;
}

function parseJobStatus(value: unknown): DownloadJobStatus | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase() as DownloadJobStatus;
  return JOB_STATUSES.includes(upper) ? upper : null;
}

function parseProvider(value: unknown): DownloadJobProvider | null {
  if (value === undefined || value === null) return "GOOGLE_DRIVE";
  if (value === "GOOGLE_DRIVE" || value === "google_drive") return "GOOGLE_DRIVE";
  return null;
}

export function parseHeartbeatBody(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Requisição inválida." };
  const deviceId = parseExternalDeviceId((body as { deviceId?: unknown }).deviceId);
  if (!deviceId) return { error: "deviceId inválido." };
  return { value: { deviceId } };
}

export function parseClaimJobBody(body: unknown) {
  return parseHeartbeatBody(body);
}

export function parseRegisterDeviceBody(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Requisição inválida." };
  const data = body as Record<string, unknown>;
  const deviceId = parseExternalDeviceId(data.deviceId);
  const deviceName = parseOptionalString(data.deviceName, MAX_DEVICE_NAME_LENGTH);
  const platform = parseOptionalString(data.platform, MAX_PLATFORM_LENGTH);
  const appVersion = parseOptionalString(data.appVersion, MAX_APP_VERSION_LENGTH);

  if (!deviceId) return { error: "deviceId inválido." };
  if (!deviceName) return { error: "deviceName inválido." };
  if (!platform) return { error: "platform inválido." };
  if (!appVersion) return { error: "appVersion inválido." };

  return { value: { deviceId, deviceName, platform, appVersion } };
}

export function parseCreateJobBody(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Requisição inválida." };
  const data = body as Record<string, unknown>;
  const fileId = parseDriveFileId(data.fileId);
  const fileName = parseFileName(data.fileName);
  const relativePath = parseOptionalString(data.relativePath, MAX_RELATIVE_PATH_LENGTH);
  const targetDeviceId = parseExternalDeviceId(data.targetDeviceId ?? null);
  const fileSize = parseBigIntInput(data.fileSize);
  const mimeType = parseOptionalString(data.mimeType, 128);
  const provider = parseProvider(data.provider);

  if (!fileId) return { error: "fileId inválido." };
  if (!fileName) return { error: "fileName inválido." };
  if (data.relativePath !== undefined && data.relativePath !== null && !relativePath) {
    return { error: "relativePath inválido." };
  }
  if (data.targetDeviceId !== undefined && data.targetDeviceId !== null && !targetDeviceId) {
    return { error: "targetDeviceId inválido." };
  }
  if (data.fileSize !== undefined && data.fileSize !== null && fileSize === null) {
    return { error: "fileSize inválido." };
  }
  if (data.mimeType !== undefined && data.mimeType !== null && !mimeType) {
    return { error: "mimeType inválido." };
  }
  if (!provider) return { error: "provider inválido." };

  return {
    value: {
      fileId,
      fileName,
      relativePath,
      targetDeviceId,
      fileSize,
      mimeType,
      provider,
    },
  };
}

export function parseBatchCreateJobsBody(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Requisição inválida." };
  const jobs = (body as { jobs?: unknown }).jobs;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return { error: "Informe ao menos um job em jobs." };
  }
  if (jobs.length > MAX_BATCH_JOBS) {
    return { error: `Máximo de ${MAX_BATCH_JOBS} jobs por lote.` };
  }

  const parsed: DownloadJobInput[] = [];
  for (const item of jobs) {
    const result = parseCreateJobBody(item);
    if ("error" in result && result.error) return { error: result.error };
    if ("value" in result && result.value) parsed.push(result.value);
  }

  return { value: parsed };
}

export function parseJobUpdateBody(body: unknown) {
  if (!body || typeof body !== "object") return { error: "Requisição inválida." };
  const data = body as Record<string, unknown>;

  const status = data.status === undefined ? undefined : parseJobStatus(data.status);
  const progress = data.progress === undefined ? undefined : parseProgress(data.progress);
  const downloadedBytes =
    data.downloadedBytes === undefined ? undefined : parseBigIntInput(data.downloadedBytes);
  const totalBytes = data.totalBytes === undefined ? undefined : parseBigIntInput(data.totalBytes);
  const error =
    data.error === undefined
      ? undefined
      : data.error === null
        ? null
        : parseOptionalString(data.error, MAX_ERROR_LENGTH);
  const deviceId = data.deviceId === undefined ? undefined : parseExternalDeviceId(data.deviceId);

  if (data.status !== undefined && !status) return { error: "status inválido." };
  if (data.progress !== undefined && progress === null) return { error: "progress inválido." };
  if (data.downloadedBytes !== undefined && downloadedBytes === null) {
    return { error: "downloadedBytes inválido." };
  }
  if (data.totalBytes !== undefined && data.totalBytes !== null && totalBytes === null) {
    return { error: "totalBytes inválido." };
  }
  if (data.error !== undefined && data.error !== null && error === null) {
    return { error: "error inválido." };
  }
  if (data.deviceId !== undefined && !deviceId) return { error: "deviceId inválido." };

  if (
    status === undefined &&
    progress === undefined &&
    downloadedBytes === undefined &&
    totalBytes === undefined &&
    error === undefined
  ) {
    return { error: "Nenhum campo para atualizar." };
  }

  return {
    value: {
      ...(status !== undefined && status !== null ? { status } : {}),
      ...(progress !== undefined && progress !== null ? { progress } : {}),
      ...(downloadedBytes !== undefined && downloadedBytes !== null ? { downloadedBytes } : {}),
      ...(totalBytes !== undefined ? { totalBytes } : {}),
      ...(error !== undefined ? { error } : {}),
      ...(deviceId ? { deviceId } : {}),
    },
  };
}

export function parseListJobsQuery(searchParams: URLSearchParams) {
  const statusParam = searchParams.get("status");
  const status = statusParam ? parseJobStatus(statusParam) : null;
  if (statusParam && !status) return { error: "status inválido." };

  const deviceIdParam = searchParams.get("deviceId");
  const deviceId = deviceIdParam ? parseExternalDeviceId(deviceIdParam) : null;
  if (deviceIdParam && !deviceId) return { error: "deviceId inválido." };

  const fileIdsParam = searchParams.get("fileIds");
  const fileIds = fileIdsParam
    ? fileIdsParam
        .split(",")
        .map((value) => parseDriveFileId(value.trim()))
        .filter((value): value is string => Boolean(value))
    : null;
  if (fileIdsParam && (!fileIds || fileIds.length === 0)) {
    return { error: "fileIds inválido." };
  }

  const includeDismissed = searchParams.get("includeDismissed") === "1";
  const queueForDevice = searchParams.get("queue") === "1";

  const limitParam = searchParams.get("limit");
  let limit = 50;
  if (limitParam) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIST_JOBS) {
      return { error: `limit deve ser entre 1 e ${MAX_LIST_JOBS}.` };
    }
    limit = parsed;
  }

  if (queueForDevice && !deviceId) {
    return { error: "deviceId é obrigatório quando queue=1." };
  }

  return { value: { status, deviceId, fileIds, includeDismissed, limit, queueForDevice } };
}

export function serializeDownloadDevice(device: DownloadDevice) {
  return {
    id: device.id,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
    appVersion: device.appVersion,
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    isOnline: isDeviceOnline(device.lastSeenAt),
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString(),
  };
}

export function isDeviceOnline(lastSeenAt: Date | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - lastSeenAt.getTime() < DEVICE_ONLINE_MS;
}

export function serializeDownloadJob(job: DownloadJob & { downloadDevice?: DownloadDevice | null }) {
  return {
    id: job.id,
    provider: job.provider,
    fileId: job.fileId,
    fileName: job.fileName,
    relativePath: job.relativePath,
    targetDeviceId: job.targetDeviceId,
    fileSize: job.fileSize?.toString() ?? null,
    mimeType: job.mimeType,
    status: job.status,
    progress: job.progress,
    downloadedBytes: job.downloadedBytes.toString(),
    totalBytes: job.totalBytes?.toString() ?? null,
    error: job.error,
    deviceId: job.downloadDevice?.deviceId ?? null,
    deviceName: job.downloadDevice?.deviceName ?? null,
    downloadDeviceId: job.downloadDeviceId,
    claimedAt: job.claimedAt?.toISOString() ?? null,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    dismissedAt: job.dismissedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function getOwnedDevice(portalUserId: number, externalDeviceId: string) {
  return prisma.downloadDevice.findUnique({
    where: {
      portalUserId_deviceId: {
        portalUserId,
        deviceId: externalDeviceId,
      },
    },
  });
}

async function getOwnedJob(portalUserId: number, jobId: number) {
  return prisma.downloadJob.findFirst({
    where: { id: jobId, portalUserId },
    include: { downloadDevice: true },
  });
}

function toStoredBigInt(value: string | number | bigint | null | undefined): bigint | null {
  if (value == null) return null;
  return parseBigIntInput(value);
}

function buildJobCreateData(portalUserId: number, input: DownloadJobInput) {
  return {
    portalUserId,
    provider: input.provider ?? "GOOGLE_DRIVE",
    fileId: input.fileId,
    fileName: input.fileName,
    relativePath: input.relativePath ?? null,
    targetDeviceId: input.targetDeviceId ?? null,
    fileSize: toStoredBigInt(input.fileSize),
    mimeType: input.mimeType ?? null,
  };
}

export async function registerDownloadDevice(
  portalUserId: number,
  input: { deviceId: string; deviceName: string; platform: string; appVersion: string },
) {
  const now = new Date();
  const device = await prisma.downloadDevice.upsert({
    where: {
      portalUserId_deviceId: {
        portalUserId,
        deviceId: input.deviceId,
      },
    },
    create: {
      portalUserId,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform,
      appVersion: input.appVersion,
      lastSeenAt: now,
    },
    update: {
      deviceName: input.deviceName,
      platform: input.platform,
      appVersion: input.appVersion,
      lastSeenAt: now,
    },
  });

  return serializeDownloadDevice(device);
}

export async function listDownloadDevices(portalUserId: number) {
  const devices = await prisma.downloadDevice.findMany({
    where: { portalUserId },
    orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
  });
  return devices.map(serializeDownloadDevice);
}

export async function heartbeatDownloadDevice(portalUserId: number, externalDeviceId: string) {
  const device = await getOwnedDevice(portalUserId, externalDeviceId);
  if (!device) return null;

  const updated = await prisma.downloadDevice.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() },
  });

  return serializeDownloadDevice(updated);
}

export async function createDownloadJob(portalUserId: number, input: DownloadJobInput) {
  const job = await prisma.downloadJob.create({
    data: buildJobCreateData(portalUserId, input),
    include: { downloadDevice: true },
  });
  return serializeDownloadJob(job);
}

export async function createDownloadJobsBatch(portalUserId: number, inputs: DownloadJobInput[]) {
  const data = inputs.map((input) => buildJobCreateData(portalUserId, input));
  const jobs = [];

  for (let offset = 0; offset < data.length; offset += BATCH_CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + BATCH_CHUNK_SIZE);
    const created = await prisma.downloadJob.createManyAndReturn({
      data: chunk,
      include: { downloadDevice: true },
    });
    jobs.push(...created);
  }

  return jobs.map(serializeDownloadJob);
}

export async function listDownloadJobs(
  portalUserId: number,
  filters: {
    status: DownloadJobStatus | null;
    deviceId: string | null;
    fileIds: string[] | null;
    includeDismissed: boolean;
    limit: number;
    queueForDevice?: boolean;
  },
) {
  if (filters.queueForDevice && filters.deviceId) {
    await reclaimStaleQueueJobs(portalUserId, filters.deviceId);

    const jobs = await prisma.downloadJob.findMany({
      where: {
        portalUserId,
        dismissedAt: null,
        OR: [
          {
            status: "PENDING",
            downloadDeviceId: null,
            OR: [{ targetDeviceId: null }, { targetDeviceId: filters.deviceId }],
          },
          {
            status: { in: ACTIVE_QUEUE_STATUSES.filter((value) => value !== "PENDING") },
            downloadDevice: { deviceId: filters.deviceId },
          },
          {
            status: "FAILED",
            downloadDevice: { deviceId: filters.deviceId },
          },
          {
            status: "COMPLETED",
            downloadDevice: { deviceId: filters.deviceId },
          },
        ],
      },
      include: { downloadDevice: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: filters.limit,
    });

    return jobs.map(serializeDownloadJob);
  }

  const where: {
    portalUserId: number;
    status?: DownloadJobStatus;
    dismissedAt?: null;
    fileId?: { in: string[] };
    downloadDevice?: { deviceId: string };
  } = { portalUserId };

  if (filters.status) where.status = filters.status;
  if (!filters.includeDismissed) where.dismissedAt = null;
  if (filters.fileIds?.length) where.fileId = { in: filters.fileIds };
  if (filters.deviceId) {
    where.downloadDevice = { deviceId: filters.deviceId };
  }

  const jobs = await prisma.downloadJob.findMany({
    where,
    include: { downloadDevice: true },
    orderBy: [{ createdAt: "desc" }],
    take: filters.limit,
  });

  return jobs.map(serializeDownloadJob);
}

function assertDeviceCanTouchJob(
  job: DownloadJob & { downloadDevice?: DownloadDevice | null },
  externalDeviceId?: string,
) {
  if (!externalDeviceId) return;
  if (!job.downloadDeviceId || !job.downloadDevice) {
    throw new Error("Job ainda não foi atribuído a um dispositivo.");
  }
  if (job.downloadDevice.deviceId !== externalDeviceId) {
    throw new Error("Este job pertence a outro dispositivo.");
  }
}

export async function updateDownloadJob(
  portalUserId: number,
  jobId: number,
  input: DownloadJobUpdateInput,
) {
  const job = await getOwnedJob(portalUserId, jobId);
  if (!job) return null;

  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    throw new Error("Job não pode ser atualizado neste status.");
  }

  assertDeviceCanTouchJob(job, input.deviceId);

  const now = new Date();
  const data: {
    status?: DownloadJobStatus;
    progress?: number;
    downloadedBytes?: bigint;
    totalBytes?: bigint | null;
    error?: string | null;
    startedAt?: Date;
    completedAt?: Date | null;
  } = {};

  if (input.progress !== undefined) data.progress = input.progress;
  if (input.downloadedBytes !== undefined) {
    const bytes = parseBigIntInput(input.downloadedBytes);
    if (bytes !== null) data.downloadedBytes = bytes;
  }
  if (input.totalBytes !== undefined) {
    data.totalBytes = input.totalBytes === null ? null : parseBigIntInput(input.totalBytes);
  }
  if (input.error !== undefined) data.error = input.error;

  if (input.status) {
    data.status = input.status;
    if (input.status === "DOWNLOADING" && !job.startedAt) {
      data.startedAt = now;
    }
    if (input.status === "COMPLETED") {
      data.completedAt = now;
      data.progress = 100;
    }
    if (input.status === "FAILED" && input.error === undefined && !job.error) {
      data.error = "Falha no download.";
    }
    if (input.status === "PENDING" || input.status === "RECEIVED") {
      data.completedAt = null;
    }
  }

  const updated = await prisma.downloadJob.update({
    where: { id: job.id },
    data,
    include: { downloadDevice: true },
  });

  return serializeDownloadJob(updated);
}

export async function cancelDownloadJob(portalUserId: number, jobId: number) {
  const job = await getOwnedJob(portalUserId, jobId);
  if (!job) return null;

  if (!CANCELLABLE_STATUSES.includes(job.status)) {
    throw new Error("Job não pode ser cancelado neste status.");
  }

  const updated = await prisma.downloadJob.update({
    where: { id: job.id },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
      error: null,
    },
    include: { downloadDevice: true },
  });

  return serializeDownloadJob(updated);
}

export async function retryDownloadJob(portalUserId: number, jobId: number) {
  const job = await getOwnedJob(portalUserId, jobId);
  if (!job) return null;

  if (job.status !== "FAILED") {
    throw new Error("Somente jobs com falha podem ser reenviados.");
  }

  const updated = await prisma.downloadJob.update({
    where: { id: job.id },
    data: {
      status: "PENDING",
      progress: 0,
      downloadedBytes: BigInt(0),
      totalBytes: job.fileSize,
      error: null,
      downloadDeviceId: null,
      claimedAt: null,
      startedAt: null,
      completedAt: null,
    },
    include: { downloadDevice: true },
  });

  return serializeDownloadJob(updated);
}

export async function claimDownloadJob(portalUserId: number, jobId: number, externalDeviceId: string) {
  const device = await getOwnedDevice(portalUserId, externalDeviceId);
  if (!device) {
    throw new Error("Dispositivo não registrado.");
  }

  const now = new Date();

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.downloadJob.updateMany({
      where: {
        id: jobId,
        portalUserId,
        status: "PENDING",
        downloadDeviceId: null,
        dismissedAt: null,
        OR: [{ targetDeviceId: null }, { targetDeviceId: externalDeviceId }],
      },
      data: {
        status: "RECEIVED",
        downloadDeviceId: device.id,
        claimedAt: now,
      },
    });

    if (result.count === 0) return null;

    return tx.downloadJob.findUnique({
      where: { id: jobId },
      include: { downloadDevice: true },
    });
  });

  if (!claimed) {
    const existing = await getOwnedJob(portalUserId, jobId);
    if (!existing) return { kind: "not_found" as const };
    return { kind: "conflict" as const, job: serializeDownloadJob(existing) };
  }

  return { kind: "claimed" as const, job: serializeDownloadJob(claimed) };
}

async function countDeviceQueue(portalUserId: number, externalDeviceId: string) {
  return prisma.downloadJob.count({
    where: {
      portalUserId,
      dismissedAt: null,
      status: { in: ACTIVE_QUEUE_STATUSES },
      OR: [
        { targetDeviceId: externalDeviceId },
        { downloadDevice: { deviceId: externalDeviceId } },
        {
          status: "PENDING",
          targetDeviceId: null,
          downloadDeviceId: null,
        },
      ],
    },
  });
}

/** Devolve jobs presos em dispositivos offline para PENDING, liberando a fila no PC atual. */
export async function reclaimStaleQueueJobs(portalUserId: number, currentDeviceId: string) {
  const offlineBefore = new Date(Date.now() - DEVICE_ONLINE_MS);

  await prisma.downloadJob.updateMany({
    where: {
      portalUserId,
      dismissedAt: null,
      status: { in: ["RECEIVED", "DOWNLOADING", "PAUSED"] },
      downloadDevice: {
        deviceId: { not: currentDeviceId },
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: offlineBefore } }],
      },
    },
    data: {
      status: "PENDING",
      downloadDeviceId: null,
      claimedAt: null,
      startedAt: null,
      error: null,
    },
  });
}

export async function getDownloaderSync(portalUserId: number) {
  const devices = await prisma.downloadDevice.findMany({
    where: { portalUserId },
    orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
  });

  const serializedDevices = await Promise.all(
    devices.map(async (device) => ({
      ...serializeDownloadDevice(device),
      queueCount: await countDeviceQueue(portalUserId, device.deviceId),
    })),
  );

  const totalQueueCount = await prisma.downloadJob.count({
    where: {
      portalUserId,
      dismissedAt: null,
      status: { in: ACTIVE_QUEUE_STATUSES },
    },
  });

  const recentJobs = await prisma.downloadJob.findMany({
    where: {
      portalUserId,
      dismissedAt: null,
      status: { not: "CANCELLED" },
    },
    include: { downloadDevice: true },
    orderBy: [{ updatedAt: "desc" }],
    take: MAX_LIST_JOBS,
  });

  const jobsByFileId: Record<string, ReturnType<typeof serializeDownloadJob>> = {};
  for (const job of recentJobs) {
    if (!jobsByFileId[job.fileId]) {
      jobsByFileId[job.fileId] = serializeDownloadJob(job);
    }
  }

  return {
    devices: serializedDevices,
    totalQueueCount,
    jobsByFileId,
  };
}

export async function dismissDownloadJob(portalUserId: number, jobId: number) {
  const job = await getOwnedJob(portalUserId, jobId);
  if (!job) return null;

  if (!["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) {
    throw new Error("Somente jobs finalizados podem ser removidos do histórico.");
  }

  const updated = await prisma.downloadJob.update({
    where: { id: job.id },
    data: { dismissedAt: new Date() },
    include: { downloadDevice: true },
  });

  return serializeDownloadJob(updated);
}
