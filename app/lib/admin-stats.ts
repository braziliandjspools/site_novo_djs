import "server-only";
import { prisma } from "./prisma";
import { DEVICE_ONLINE_MS, isDeviceOnline } from "./downloader";
import { getVipMusicInventory, type VipMusicInventory } from "./vip-music-inventory";

export type AdminDownloaderDeviceRow = {
  id: number;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  lastSeenAt: string | null;
  isOnline: boolean;
  createdAt: string;
};

export type AdminDownloaderUserRow = {
  userId: number;
  name: string;
  email: string;
  active: boolean;
  poolsVip: boolean;
  onlineCount: number;
  deviceCount: number;
  devices: AdminDownloaderDeviceRow[];
};

export type AdminStatsPayload = {
  generatedAt: string;
  catalog: VipMusicInventory;
  portal: {
    totalUsers: number;
    activeUsers: number;
    vipUsers: number;
    allavsoftUsers: number;
  };
  downloaders: {
    onlineWindowSeconds: number;
    connectedPcs: number;
    registeredPcs: number;
    usersWithConnected: number;
    usersWithAnyDevice: number;
    users: AdminDownloaderUserRow[];
  };
  jobs: {
    pending: number;
    downloading: number;
    paused: number;
    failed: number;
    completed: number;
  };
};

export async function getAdminStats(options?: {
  forceCatalogRefresh?: boolean;
}): Promise<AdminStatsPayload> {
  const [
    catalog,
    totalUsers,
    activeUsers,
    vipUsers,
    allavsoftUsers,
    devices,
    pending,
    downloading,
    paused,
    failed,
    completed,
  ] = await Promise.all([
    getVipMusicInventory({ forceRefresh: options?.forceCatalogRefresh }),
    prisma.portalUser.count(),
    prisma.portalUser.count({ where: { active: true } }),
    prisma.portalUser.count({ where: { active: true, servicePoolsVip: true } }),
    prisma.portalUser.count({ where: { active: true, serviceAllavsoft: true } }),
    prisma.downloadDevice.findMany({
      include: {
        portalUser: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
            servicePoolsVip: true,
          },
        },
      },
      orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.downloadJob.count({
      where: { status: { in: ["PENDING", "RECEIVED"] } },
    }),
    prisma.downloadJob.count({ where: { status: "DOWNLOADING" } }),
    prisma.downloadJob.count({ where: { status: "PAUSED" } }),
    prisma.downloadJob.count({ where: { status: "FAILED" } }),
    prisma.downloadJob.count({ where: { status: "COMPLETED" } }),
  ]);

  const byUser = new Map<number, AdminDownloaderUserRow>();

  for (const device of devices) {
    const user = device.portalUser;
    const row =
      byUser.get(user.id) ??
      ({
        userId: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
        poolsVip: user.servicePoolsVip,
        onlineCount: 0,
        deviceCount: 0,
        devices: [],
      } satisfies AdminDownloaderUserRow);

    const deviceRow: AdminDownloaderDeviceRow = {
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
      appVersion: device.appVersion,
      lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
      isOnline: isDeviceOnline(device.lastSeenAt),
      createdAt: device.createdAt.toISOString(),
    };

    row.devices.push(deviceRow);
    row.deviceCount += 1;
    if (deviceRow.isOnline) row.onlineCount += 1;
    byUser.set(user.id, row);
  }

  const users = [...byUser.values()].sort((a, b) => {
    if (b.onlineCount !== a.onlineCount) return b.onlineCount - a.onlineCount;
    if (b.deviceCount !== a.deviceCount) return b.deviceCount - a.deviceCount;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  const connectedPcs = devices.filter((device) => isDeviceOnline(device.lastSeenAt)).length;
  const usersWithConnected = users.filter((user) => user.onlineCount > 0).length;

  return {
    generatedAt: new Date().toISOString(),
    catalog,
    portal: {
      totalUsers,
      activeUsers,
      vipUsers,
      allavsoftUsers,
    },
    downloaders: {
      onlineWindowSeconds: Math.round(DEVICE_ONLINE_MS / 1000),
      connectedPcs,
      registeredPcs: devices.length,
      usersWithConnected,
      usersWithAnyDevice: users.length,
      users,
    },
    jobs: {
      pending,
      downloading,
      paused,
      failed,
      completed,
    },
  };
}

export function adminOnlineWindowSeconds() {
  return Math.round(DEVICE_ONLINE_MS / 1000);
}
