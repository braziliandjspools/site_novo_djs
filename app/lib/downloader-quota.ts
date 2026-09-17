import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  buildQuotaSnapshot,
  getQuotaLimits,
  quotaTierFromPlanId,
  quotaTierFromPoolsValue,
  type DownloaderQuotaSnapshot,
  type DownloaderQuotaTier,
} from "./downloader-quota-config";

export class DownloaderQuotaExceededError extends Error {
  readonly status = 429;
  readonly quota: DownloaderQuotaSnapshot;

  constructor(quota: DownloaderQuotaSnapshot, message: string) {
    super(message);
    this.name = "DownloaderQuotaExceededError";
    this.quota = quota;
  }
}

function asTier(value: string | null | undefined): DownloaderQuotaTier {
  if (value === "PRO" || value === "MAX" || value === "STARTER") return value;
  return "STARTER";
}

export async function resolveUserQuotaTier(portalUserId: number): Promise<DownloaderQuotaTier> {
  const user = await prisma.portalUser.findUnique({
    where: { id: portalUserId },
    select: {
      downloaderQuotaTier: true,
      servicePoolsVipValue: true,
    },
  });
  if (!user) return "STARTER";
  if (user.downloaderQuotaTier) return asTier(user.downloaderQuotaTier);
  return quotaTierFromPoolsValue(Number(user.servicePoolsVipValue));
}

export async function setUserQuotaTierFromPlanId(
  portalUserId: number,
  planId: string,
  tx?: Prisma.TransactionClient,
) {
  const tier = quotaTierFromPlanId(planId);
  if (!tier) return;
  const client = tx ?? prisma;
  await client.portalUser.update({
    where: { id: portalUserId },
    data: { downloaderQuotaTier: tier },
  });
}

async function loadOrResetWindow(
  portalUserId: number,
  tier: DownloaderQuotaTier,
  now: Date,
) {
  const limits = getQuotaLimits(tier);
  const existing = await prisma.downloaderQuotaState.findUnique({
    where: { portalUserId },
  });

  if (!existing) {
    return prisma.downloaderQuotaState.create({
      data: {
        portalUserId,
        windowStartedAt: now,
        tracksUsed: 0,
        packsUsed: 0,
      },
    });
  }

  const endsAt = existing.windowStartedAt.getTime() + limits.windowMs;
  if (now.getTime() >= endsAt) {
    return prisma.downloaderQuotaState.update({
      where: { portalUserId },
      data: {
        windowStartedAt: now,
        tracksUsed: 0,
        packsUsed: 0,
      },
    });
  }

  return existing;
}

export async function getDownloaderQuotaSnapshot(
  portalUserId: number,
  now = new Date(),
): Promise<DownloaderQuotaSnapshot> {
  const tier = await resolveUserQuotaTier(portalUserId);
  const state = await loadOrResetWindow(portalUserId, tier, now);
  return buildQuotaSnapshot({
    tier,
    tracksUsed: state.tracksUsed,
    packsUsed: state.packsUsed,
    windowStartedAt: state.windowStartedAt,
    now,
  });
}

/**
 * Reserva faixas individuais (não pack).
 * Lança DownloaderQuotaExceededError se não couber.
 */
export async function consumeDownloaderTrackQuota(
  portalUserId: number,
  trackCount: number,
  now = new Date(),
): Promise<DownloaderQuotaSnapshot> {
  if (trackCount <= 0) {
    return getDownloaderQuotaSnapshot(portalUserId, now);
  }

  const tier = await resolveUserQuotaTier(portalUserId);
  const limits = getQuotaLimits(tier);

  return prisma.$transaction(async (tx) => {
    let state = await tx.downloaderQuotaState.findUnique({ where: { portalUserId } });
    if (!state) {
      state = await tx.downloaderQuotaState.create({
        data: {
          portalUserId,
          windowStartedAt: now,
          tracksUsed: 0,
          packsUsed: 0,
        },
      });
    } else {
      const endsAt = state.windowStartedAt.getTime() + limits.windowMs;
      if (now.getTime() >= endsAt) {
        state = await tx.downloaderQuotaState.update({
          where: { portalUserId },
          data: { windowStartedAt: now, tracksUsed: 0, packsUsed: 0 },
        });
      }
    }

    const snapshotBefore = buildQuotaSnapshot({
      tier,
      tracksUsed: state.tracksUsed,
      packsUsed: state.packsUsed,
      windowStartedAt: state.windowStartedAt,
      now,
    });

    if (limits.packLimit != null && state.packsUsed >= limits.packLimit) {
      throw new DownloaderQuotaExceededError(
        snapshotBefore,
        `Cota do plano ${limits.label} esgotada: você já enviou 1 pack nesta janela. Liberação em ${snapshotBefore.resetsInSeconds}s.`,
      );
    }

    if (state.tracksUsed + trackCount > limits.trackLimit) {
      throw new DownloaderQuotaExceededError(
        snapshotBefore,
        `Cota do plano ${limits.label} insuficiente: restam ${snapshotBefore.tracksRemaining} de ${limits.trackLimit} faixas. Liberação em ${snapshotBefore.resetsInSeconds}s.`,
      );
    }

    const updated = await tx.downloaderQuotaState.update({
      where: { portalUserId },
      data: { tracksUsed: { increment: trackCount } },
    });

    return buildQuotaSnapshot({
      tier,
      tracksUsed: updated.tracksUsed,
      packsUsed: updated.packsUsed,
      windowStartedAt: updated.windowStartedAt,
      now,
    });
  });
}

/**
 * Reserva envio de pack/artista (conta como 1 pack no STARTER).
 * Pack com N faixas: consome N na contagem (até o limite + overflow permitido
 * quando o pack inteiro estoura o limite — aí esgota a janela).
 */
export async function consumeDownloaderPackQuota(
  portalUserId: number,
  trackCount: number,
  now = new Date(),
): Promise<DownloaderQuotaSnapshot> {
  const tier = await resolveUserQuotaTier(portalUserId);
  const limits = getQuotaLimits(tier);
  const safeTracks = Math.max(0, trackCount);

  return prisma.$transaction(async (tx) => {
    let state = await tx.downloaderQuotaState.findUnique({ where: { portalUserId } });
    if (!state) {
      state = await tx.downloaderQuotaState.create({
        data: {
          portalUserId,
          windowStartedAt: now,
          tracksUsed: 0,
          packsUsed: 0,
        },
      });
    } else {
      const endsAt = state.windowStartedAt.getTime() + limits.windowMs;
      if (now.getTime() >= endsAt) {
        state = await tx.downloaderQuotaState.update({
          where: { portalUserId },
          data: { windowStartedAt: now, tracksUsed: 0, packsUsed: 0 },
        });
      }
    }

    const snapshotBefore = buildQuotaSnapshot({
      tier,
      tracksUsed: state.tracksUsed,
      packsUsed: state.packsUsed,
      windowStartedAt: state.windowStartedAt,
      now,
    });

    if (limits.packLimit != null) {
      if (state.packsUsed >= limits.packLimit) {
        throw new DownloaderQuotaExceededError(
          snapshotBefore,
          `Cota do plano ${limits.label}: limite de 1 pack por ${snapshotBefore.periodLabel} já usado. Liberação em ${snapshotBefore.resetsInSeconds}s.`,
        );
      }
      // Pack esgota a janela (mesmo se tiver mais faixas que o limite).
      const updated = await tx.downloaderQuotaState.update({
        where: { portalUserId },
        data: {
          packsUsed: { increment: 1 },
          tracksUsed: limits.trackLimit,
        },
      });
      return buildQuotaSnapshot({
        tier,
        tracksUsed: updated.tracksUsed,
        packsUsed: updated.packsUsed,
        windowStartedAt: updated.windowStartedAt,
        now,
      });
    }

    // PRO / MAX: pack conta como N faixas; se não couber, bloqueia.
    if (state.tracksUsed + safeTracks > limits.trackLimit) {
      throw new DownloaderQuotaExceededError(
        snapshotBefore,
        `Cota do plano ${limits.label} insuficiente para este pack (${safeTracks} faixas). Restam ${snapshotBefore.tracksRemaining}. Liberação em ${snapshotBefore.resetsInSeconds}s.`,
      );
    }

    const updated = await tx.downloaderQuotaState.update({
      where: { portalUserId },
      data: { tracksUsed: { increment: safeTracks } },
    });

    return buildQuotaSnapshot({
      tier,
      tracksUsed: updated.tracksUsed,
      packsUsed: updated.packsUsed,
      windowStartedAt: updated.windowStartedAt,
      now,
    });
  });
}

/** Admin: zera a janela atual. */
export async function resetDownloaderQuota(portalUserId: number, now = new Date()) {
  await prisma.downloaderQuotaState.upsert({
    where: { portalUserId },
    create: {
      portalUserId,
      windowStartedAt: now,
      tracksUsed: 0,
      packsUsed: 0,
    },
    update: {
      windowStartedAt: now,
      tracksUsed: 0,
      packsUsed: 0,
    },
  });
  return getDownloaderQuotaSnapshot(portalUserId, now);
}
