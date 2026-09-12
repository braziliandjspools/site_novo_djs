import "server-only";
import { prisma } from "./prisma";
import { DEVICE_ONLINE_MS, serializeDownloadDevice } from "./downloader";

export type PortalDownloaderStats = {
  generatedAt: string;
  onlineWindowSeconds: number;
  devices: {
    total: number;
    online: number;
    items: Array<{
      id: number;
      deviceId: string;
      deviceName: string;
      platform: string;
      appVersion: string;
      lastSeenAt: string | null;
      isOnline: boolean;
      createdAt: string;
    }>;
  };
  jobs: {
    pending: number;
    downloading: number;
    paused: number;
    failed: number;
    completed: number;
    cancelled: number;
    /** Itens ainda na fila (pending + received + downloading + paused). */
    inQueue: number;
    /** Soma de bytes baixados em jobs COMPLETED. */
    completedBytes: string;
  };
  recent: Array<{
    id: number;
    fileName: string;
    status: string;
    progress: number;
    completedAt: string | null;
    createdAt: string;
    error: string | null;
  }>;
};

export async function getPortalDownloaderStats(
  portalUserId: number,
): Promise<PortalDownloaderStats> {
  const [
    devices,
    pending,
    downloading,
    paused,
    failed,
    completed,
    cancelled,
    completedBytesAgg,
    recentJobs,
  ] = await Promise.all([
    prisma.downloadDevice.findMany({
      where: { portalUserId },
      orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.downloadJob.count({
      where: { portalUserId, status: { in: ["PENDING", "RECEIVED"] } },
    }),
    prisma.downloadJob.count({
      where: { portalUserId, status: "DOWNLOADING" },
    }),
    prisma.downloadJob.count({
      where: { portalUserId, status: "PAUSED" },
    }),
    prisma.downloadJob.count({
      where: { portalUserId, status: "FAILED" },
    }),
    prisma.downloadJob.count({
      where: { portalUserId, status: "COMPLETED" },
    }),
    prisma.downloadJob.count({
      where: { portalUserId, status: "CANCELLED" },
    }),
    prisma.downloadJob.aggregate({
      where: { portalUserId, status: "COMPLETED" },
      _sum: { downloadedBytes: true },
    }),
    prisma.downloadJob.findMany({
      where: { portalUserId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        fileName: true,
        status: true,
        progress: true,
        completedAt: true,
        createdAt: true,
        error: true,
      },
    }),
  ]);

  const items = devices.map((device) => {
    const serialized = serializeDownloadDevice(device);
    return {
      id: serialized.id,
      deviceId: serialized.deviceId,
      deviceName: serialized.deviceName,
      platform: serialized.platform,
      appVersion: serialized.appVersion,
      lastSeenAt: serialized.lastSeenAt,
      isOnline: serialized.isOnline,
      createdAt: serialized.createdAt,
    };
  });

  const online = items.filter((d) => d.isOnline).length;

  return {
    generatedAt: new Date().toISOString(),
    onlineWindowSeconds: Math.round(DEVICE_ONLINE_MS / 1000),
    devices: {
      total: items.length,
      online,
      items,
    },
    jobs: {
      pending,
      downloading,
      paused,
      failed,
      completed,
      cancelled,
      inQueue: pending + downloading + paused,
      completedBytes: (completedBytesAgg._sum.downloadedBytes ?? 0n).toString(),
    },
    recent: recentJobs.map((job) => ({
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      progress: job.progress,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      error: job.error,
    })),
  };
}
