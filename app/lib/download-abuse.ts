import { prisma } from "./prisma";
import { getLastApprovedVipOrder } from "./portal-renewals";
import {
  ABUSE_CODES,
  abuseMessageAlert,
  abuseMessageBanned,
  evaluateAbuseCounters,
  HIT_DEDUPE_MS,
  PAID_PLAN_ABUSE_THRESHOLDS,
  TEST_PLAN_ABUSE_THRESHOLDS,
  type AbuseCounters,
  type AbuseThresholds,
  type DownloadHitKind,
} from "./download-abuse-config";

export { evaluateAbuseCounters } from "./download-abuse-config";
export type { AbuseCounters } from "./download-abuse-config";

/** Bloqueio por abuso desativado — site e Downloader liberam downloads normalmente. */
const DOWNLOAD_ABUSE_ENFORCEMENT = false;

export type DownloadAbuseStatus = {
  banned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  alerted: boolean;
  alertReason: string | null;
  alertedAt: string | null;
  onTestPlan: boolean;
  code: typeof ABUSE_CODES.BANNED | typeof ABUSE_CODES.ALERT | null;
  message: string | null;
};

export type DownloadAbuseGate =
  | { ok: true; status: DownloadAbuseStatus }
  | {
      ok: false;
      status: 403;
      code: typeof ABUSE_CODES.BANNED;
      error: string;
      abuse: DownloadAbuseStatus;
    };

export class DownloadAbuseBannedError extends Error {
  readonly status = 403;
  readonly code = ABUSE_CODES.BANNED;
  readonly abuse: DownloadAbuseStatus;

  constructor(abuse: DownloadAbuseStatus) {
    super(abuse.message ?? abuseMessageBanned(abuse.banReason ?? ""));
    this.name = "DownloadAbuseBannedError";
    this.abuse = abuse;
  }
}

function trimReason(value: string, max = 480) {
  const t = value.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function isOnDriveTestPlan(portalUserId: number): Promise<boolean> {
  const last = await getLastApprovedVipOrder(portalUserId);
  return last?.planId === "brs-drive-3d";
}

function thresholdsFor(onTestPlan: boolean): AbuseThresholds {
  return onTestPlan ? TEST_PLAN_ABUSE_THRESHOLDS : PAID_PLAN_ABUSE_THRESHOLDS;
}

function mapStatus(input: {
  bannedAt: Date | null;
  banReason: string | null;
  alertAt: Date | null;
  alertReason: string | null;
  onTestPlan: boolean;
}): DownloadAbuseStatus {
  const banned = Boolean(input.bannedAt);
  const alerted = Boolean(input.alertAt) && !banned;
  const banReason = input.banReason?.trim() || null;
  const alertReason = input.alertReason?.trim() || null;
  return {
    banned,
    banReason,
    bannedAt: input.bannedAt?.toISOString() ?? null,
    alerted,
    alertReason,
    alertedAt: input.alertAt?.toISOString() ?? null,
    onTestPlan: input.onTestPlan,
    code: banned ? ABUSE_CODES.BANNED : alerted ? ABUSE_CODES.ALERT : null,
    message: banned
      ? abuseMessageBanned(banReason ?? "Uso em massa ou em loop.")
      : alerted
        ? abuseMessageAlert(alertReason ?? "Volume alto de downloads.")
        : null,
  };
}

export async function getDownloadAbuseStatus(portalUserId: number): Promise<DownloadAbuseStatus> {
  const onTestPlan = await isOnDriveTestPlan(portalUserId);

  if (!DOWNLOAD_ABUSE_ENFORCEMENT) {
    return {
      banned: false,
      banReason: null,
      bannedAt: null,
      alerted: false,
      alertReason: null,
      alertedAt: null,
      onTestPlan,
      code: null,
      message: null,
    };
  }

  const user = await prisma.portalUser.findUnique({
    where: { id: portalUserId },
    select: {
      downloadBannedAt: true,
      downloadBanReason: true,
      downloadAbuseAlertAt: true,
      downloadAbuseAlertReason: true,
    },
  });

  return mapStatus({
    bannedAt: user?.downloadBannedAt ?? null,
    banReason: user?.downloadBanReason ?? null,
    alertAt: user?.downloadAbuseAlertAt ?? null,
    alertReason: user?.downloadAbuseAlertReason ?? null,
    onTestPlan,
  });
}

export async function assertDownloadsAllowed(portalUserId: number): Promise<DownloadAbuseGate> {
  const status = await getDownloadAbuseStatus(portalUserId);
  if (!DOWNLOAD_ABUSE_ENFORCEMENT) {
    return { ok: true, status };
  }
  if (status.banned) {
    return {
      ok: false,
      status: 403,
      code: ABUSE_CODES.BANNED,
      error: status.message ?? abuseMessageBanned(""),
      abuse: status,
    };
  }
  return { ok: true, status };
}

export async function clearDownloadAbuseFlags(portalUserId: number) {
  await prisma.portalUser.update({
    where: { id: portalUserId },
    data: {
      downloadBannedAt: null,
      downloadBanReason: null,
      downloadAbuseAlertAt: null,
      downloadAbuseAlertReason: null,
    },
  });
  return getDownloadAbuseStatus(portalUserId);
}

async function cancelActiveJobs(portalUserId: number, reason: string) {
  await prisma.downloadJob.updateMany({
    where: {
      portalUserId,
      status: { in: ["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED"] },
    },
    data: {
      status: "CANCELLED",
      error: trimReason(reason),
      completedAt: new Date(),
    },
  });
}

async function applyAlert(portalUserId: number, reason: string, now: Date) {
  const user = await prisma.portalUser.findUnique({
    where: { id: portalUserId },
    select: { downloadBannedAt: true, downloadAbuseAlertAt: true },
  });
  if (!user || user.downloadBannedAt) return;
  if (user.downloadAbuseAlertAt) {
    await prisma.portalUser.update({
      where: { id: portalUserId },
      data: { downloadAbuseAlertReason: trimReason(reason) },
    });
    return;
  }
  await prisma.portalUser.update({
    where: { id: portalUserId },
    data: {
      downloadAbuseAlertAt: now,
      downloadAbuseAlertReason: trimReason(reason),
    },
  });
  console.warn("[download-abuse] alert", portalUserId, reason);
}

async function applyBan(portalUserId: number, reason: string, now: Date) {
  const user = await prisma.portalUser.findUnique({
    where: { id: portalUserId },
    select: { downloadBannedAt: true, downloadAbuseAlertAt: true },
  });
  if (!user) return;
  if (!user.downloadBannedAt) {
    await prisma.portalUser.update({
      where: { id: portalUserId },
      data: {
        downloadBannedAt: now,
        downloadBanReason: trimReason(reason),
        downloadAbuseAlertAt: user.downloadAbuseAlertAt ?? now,
        downloadAbuseAlertReason: trimReason(reason),
      },
    });
    console.warn("[download-abuse] BAN", portalUserId, reason);
  } else {
    await prisma.portalUser.update({
      where: { id: portalUserId },
      data: { downloadBanReason: trimReason(reason) },
    });
  }
  await cancelActiveJobs(portalUserId, abuseMessageBanned(reason));
}

async function collectCounters(
  portalUserId: number,
  thresholds: AbuseThresholds,
  now: Date,
  focusFileId?: string,
): Promise<AbuseCounters> {
  const uniqueSince = new Date(now.getTime() - thresholds.uniqueWindowMs);
  const hourSince = new Date(now.getTime() - HOUR_MS);
  const loopSince = new Date(now.getTime() - thresholds.loopWindowMs);

  const [uniqueRows, burstInHour, loopGroups] = await Promise.all([
    prisma.downloadFileHit.findMany({
      where: { portalUserId, createdAt: { gte: uniqueSince } },
      select: { fileId: true },
      distinct: ["fileId"],
    }),
    prisma.downloadFileHit.count({
      where: { portalUserId, createdAt: { gte: hourSince } },
    }),
    focusFileId
      ? prisma.downloadFileHit
          .count({
            where: {
              portalUserId,
              fileId: focusFileId,
              createdAt: { gte: loopSince },
            },
          })
          .then((c) => [{ _count: { fileId: c } }])
      : prisma.downloadFileHit.groupBy({
          by: ["fileId"],
          where: { portalUserId, createdAt: { gte: loopSince } },
          _count: { fileId: true },
          orderBy: { _count: { fileId: "desc" } },
          take: 1,
        }),
  ]);

  const maxFileRepeats = Array.isArray(loopGroups)
    ? Number(loopGroups[0]?._count.fileId ?? 0)
    : 0;

  return {
    uniqueInWindow: uniqueRows.length,
    burstInHour,
    maxFileRepeats,
  };
}

const HOUR_MS = 60 * 60 * 1000;

async function maybePruneOldHits(portalUserId: number, now: Date) {
  // Mantém ~7 dias; prune ocasional para não crescer sem freio.
  if (now.getMinutes() % 17 !== 0) return;
  const cutoff = new Date(now.getTime() - 7 * 24 * HOUR_MS);
  await prisma.downloadFileHit.deleteMany({
    where: { portalUserId, createdAt: { lt: cutoff } },
  });
}

/**
 * Registra acesso e aplica alerta/ban se necessário.
 * Deduplica hits iguais no intervalo HIT_DEDUPE_MS.
 */
export async function recordAndPoliceDownloadAccess(input: {
  portalUserId: number;
  fileId: string;
  kind: DownloadHitKind;
  now?: Date;
}): Promise<DownloadAbuseStatus> {
  if (!DOWNLOAD_ABUSE_ENFORCEMENT) {
    return getDownloadAbuseStatus(input.portalUserId);
  }

  const now = input.now ?? new Date();
  const gate = await assertDownloadsAllowed(input.portalUserId);
  if (!gate.ok) return gate.abuse;

  const onTestPlan = gate.status.onTestPlan;
  const thresholds = thresholdsFor(onTestPlan);

  const recent = await prisma.downloadFileHit.findFirst({
    where: {
      portalUserId: input.portalUserId,
      fileId: input.fileId,
      kind: input.kind,
      createdAt: { gte: new Date(now.getTime() - HIT_DEDUPE_MS) },
    },
    select: { id: true },
  });

  if (!recent) {
    await prisma.downloadFileHit.create({
      data: {
        portalUserId: input.portalUserId,
        fileId: input.fileId,
        kind: input.kind,
        createdAt: now,
      },
    });
  }

  await maybePruneOldHits(input.portalUserId, now);

  const counters = await collectCounters(
    input.portalUserId,
    thresholds,
    now,
    input.fileId,
  );
  const verdict = evaluateAbuseCounters(counters, thresholds, onTestPlan);

  if (verdict.action === "ban") {
    await applyBan(input.portalUserId, verdict.reason, now);
  } else if (verdict.action === "alert") {
    await applyAlert(input.portalUserId, verdict.reason, now);
  }

  return getDownloadAbuseStatus(input.portalUserId);
}

/**
 * Reserva N jobs (batch/pack). Conta cada fileId; se já banido ou estourar, lança.
 */
export async function policeJobBatch(input: {
  portalUserId: number;
  fileIds: string[];
  now?: Date;
}): Promise<DownloadAbuseStatus> {
  if (!DOWNLOAD_ABUSE_ENFORCEMENT) {
    return getDownloadAbuseStatus(input.portalUserId);
  }

  const now = input.now ?? new Date();
  const gate = await assertDownloadsAllowed(input.portalUserId);
  if (!gate.ok) {
    throw new DownloadAbuseBannedError(gate.abuse);
  }

  const uniqueIds = [...new Set(input.fileIds.filter(Boolean))];
  if (uniqueIds.length === 0) return gate.status;

  const onTestPlan = gate.status.onTestPlan;
  const thresholds = thresholdsFor(onTestPlan);
  const uniqueSince = new Date(now.getTime() - thresholds.uniqueWindowMs);

  const existingUnique = await prisma.downloadFileHit.findMany({
    where: { portalUserId: input.portalUserId, createdAt: { gte: uniqueSince } },
    select: { fileId: true },
    distinct: ["fileId"],
  });
  const projectedSet = new Set(existingUnique.map((row) => row.fileId));
  for (const id of uniqueIds) projectedSet.add(id);
  const projectedUnique = projectedSet.size;

  if (onTestPlan && projectedUnique >= thresholds.uniqueBan) {
    const reason = `Plano Teste: este envio (${uniqueIds.length} faixas) estouraria o limite de ${thresholds.uniqueBan} faixas. Faça upgrade para mensal.`;
    await applyBan(input.portalUserId, reason, now);
    throw new DownloadAbuseBannedError(await getDownloadAbuseStatus(input.portalUserId));
  }
  if (onTestPlan && projectedUnique >= thresholds.uniqueAlert) {
    await applyAlert(
      input.portalUserId,
      `Plano Teste: você está perto do limite (${projectedUnique}/${thresholds.uniqueBan} faixas).`,
      now,
    );
  }

  await prisma.downloadFileHit.createMany({
    data: uniqueIds.map((fileId) => ({
      portalUserId: input.portalUserId,
      fileId,
      kind: "job",
      createdAt: now,
    })),
  });

  const counters = await collectCounters(input.portalUserId, thresholds, now);
  const verdict = evaluateAbuseCounters(counters, thresholds, onTestPlan);
  if (verdict.action === "ban") {
    await applyBan(input.portalUserId, verdict.reason, now);
    throw new DownloadAbuseBannedError(await getDownloadAbuseStatus(input.portalUserId));
  }
  if (verdict.action === "alert") {
    await applyAlert(input.portalUserId, verdict.reason, now);
  }

  return getDownloadAbuseStatus(input.portalUserId);
}

export function abuseJsonBody(abuse: DownloadAbuseStatus, error: string) {
  return {
    error,
    code: abuse.code ?? ABUSE_CODES.BANNED,
    abuse: {
      banned: abuse.banned,
      banReason: abuse.banReason,
      bannedAt: abuse.bannedAt,
      alerted: abuse.alerted,
      alertReason: abuse.alertReason,
      alertedAt: abuse.alertedAt,
      onTestPlan: abuse.onTestPlan,
      message: abuse.message,
    },
  };
}
