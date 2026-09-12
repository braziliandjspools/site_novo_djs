import { randomInt } from "crypto";
import type { AllavsoftLicenseAssignment, AllavsoftKeyPool } from "@prisma/client";
import { prisma } from "./prisma";
import { findUserById, userHasAllavsoft } from "./portal-users";

export const MAX_ISSUES_PER_30_DAYS = 2;
export const WINDOW_DAYS = 30;

export const SEED_ALLAVSOFT_SERIALS = [
  "CD14-7158-4E06-9F7A-3CE1-CAD0-4DA2-C630",
  "9F90-010C-7BE3-6642-82B7-2FF9-F36B-53E5",
  "7F38-0FD4-A8B7-FCB1-0FF5-D602-9058-5CF8",
  "BB71-01A6-CFB3-6508-54DC-662E-7520-25AD",
  "7DB0-2DB7-5A1D-A7CF-4305-0617-F6D1-697F",
  "B2D8-605A-BB98-14F6-1104-608B-FB23-E1A4",
  "58C4-8C55-8D68-7F83-E650-ED2D-CBFB-8F9A",
  "E7DF-A553-41E3-05F7-A9B8-33B5-73DF-6D31",
  "9C06-9636-18D6-5982-2A5E-30DA-D447-718A",
  "38AA-829F-4E49-8950-3385-26CA-9E33-B00A",
] as const;

export type AllavsoftLicenseErrorCode =
  | "FORBIDDEN"
  | "QUOTA"
  | "POOL_EMPTY"
  | "NOT_FOUND"
  | "ALREADY_COPIED";

export class AllavsoftLicenseError extends Error {
  readonly code: AllavsoftLicenseErrorCode;

  constructor(code: AllavsoftLicenseErrorCode, message: string) {
    super(message);
    this.name = "AllavsoftLicenseError";
    this.code = code;
  }
}

type AssignmentWithKey = AllavsoftLicenseAssignment & { key: AllavsoftKeyPool };

function windowStart(now = new Date()) {
  return new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

function randomLicenseName() {
  return `User_${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
}

/** Upsert opcional dos seriais seed se ainda não existirem no pool. */
export async function ensurePoolSeeded() {
  await prisma.allavsoftKeyPool.createMany({
    data: SEED_ALLAVSOFT_SERIALS.map((serial) => ({ serial })),
    skipDuplicates: true,
  });
}

export async function listActiveAssignments(portalUserId: number) {
  return prisma.allavsoftLicenseAssignment.findMany({
    where: { portalUserId, copiedAt: null },
    include: { key: true },
    orderBy: { issuedAt: "desc" },
  });
}

export async function countIssuedInWindow(portalUserId: number, now = new Date()) {
  return prisma.allavsoftLicenseAssignment.count({
    where: {
      portalUserId,
      issuedAt: { gte: windowStart(now) },
    },
  });
}

async function oldestIssuedInWindow(portalUserId: number, now = new Date()) {
  return prisma.allavsoftLicenseAssignment.findFirst({
    where: {
      portalUserId,
      issuedAt: { gte: windowStart(now) },
    },
    orderBy: { issuedAt: "asc" },
    select: { issuedAt: true },
  });
}

export function serializeAssignment(assignment: AssignmentWithKey) {
  return {
    id: assignment.id,
    licenseName: assignment.licenseName,
    serial: assignment.key.serial,
    issuedAt: assignment.issuedAt.toISOString(),
    copiedAt: assignment.copiedAt?.toISOString() ?? null,
  };
}

export async function getLicenseQuota(portalUserId: number, now = new Date()) {
  const issuedInWindow = await countIssuedInWindow(portalUserId, now);
  const remaining = Math.max(0, MAX_ISSUES_PER_30_DAYS - issuedInWindow);
  let nextSlotAt: string | null = null;

  if (remaining === 0) {
    const oldest = await oldestIssuedInWindow(portalUserId, now);
    if (oldest) {
      nextSlotAt = new Date(
        oldest.issuedAt.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
    }
  }

  return {
    maxPerWindow: MAX_ISSUES_PER_30_DAYS,
    windowDays: WINDOW_DAYS,
    issuedInWindow,
    remaining,
    nextSlotAt,
  };
}

export async function listLicensesForPortal(portalUserId: number) {
  const [active, quota] = await Promise.all([
    listActiveAssignments(portalUserId),
    getLicenseQuota(portalUserId),
  ]);

  return {
    licenses: active.map(serializeAssignment),
    ...quota,
  };
}

export async function generateLicense(portalUserId: number) {
  const user = await findUserById(portalUserId);
  if (!user || !userHasAllavsoft(user)) {
    throw new AllavsoftLicenseError(
      "FORBIDDEN",
      "Seu plano não inclui Allavsoft.",
    );
  }

  await ensurePoolSeeded();

  const issuedInWindow = await countIssuedInWindow(portalUserId);
  if (issuedInWindow >= MAX_ISSUES_PER_30_DAYS) {
    throw new AllavsoftLicenseError(
      "QUOTA",
      `Limite de ${MAX_ISSUES_PER_30_DAYS} seriais a cada ${WINDOW_DAYS} dias atingido.`,
    );
  }

  try {
    const assignment = await prisma.$transaction(async (tx) => {
      const issuedInside = await tx.allavsoftLicenseAssignment.count({
        where: {
          portalUserId,
          issuedAt: { gte: windowStart() },
        },
      });
      if (issuedInside >= MAX_ISSUES_PER_30_DAYS) {
        throw new AllavsoftLicenseError(
          "QUOTA",
          `Limite de ${MAX_ISSUES_PER_30_DAYS} seriais a cada ${WINDOW_DAYS} dias atingido.`,
        );
      }

      const available = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM allavsoft_key_pool
        WHERE id NOT IN (SELECT key_id FROM allavsoft_license_assignments)
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      const keyId = available[0]?.id;
      if (!keyId) {
        throw new AllavsoftLicenseError(
          "POOL_EMPTY",
          "Não há seriais disponíveis no momento. Tente mais tarde.",
        );
      }

      return tx.allavsoftLicenseAssignment.create({
        data: {
          portalUserId,
          keyId,
          licenseName: randomLicenseName(),
        },
        include: { key: true },
      });
    });

    return serializeAssignment(assignment);
  } catch (error) {
    if (error instanceof AllavsoftLicenseError) throw error;
    throw error;
  }
}

export async function markCopied(portalUserId: number, assignmentId: string) {
  const existing = await prisma.allavsoftLicenseAssignment.findFirst({
    where: { id: assignmentId, portalUserId },
    include: { key: true },
  });

  if (!existing) {
    throw new AllavsoftLicenseError("NOT_FOUND", "Licença não encontrada.");
  }

  if (existing.copiedAt) {
    throw new AllavsoftLicenseError(
      "ALREADY_COPIED",
      "Este serial já foi copiado e consumido.",
    );
  }

  const updated = await prisma.allavsoftLicenseAssignment.update({
    where: { id: existing.id },
    data: { copiedAt: new Date() },
    include: { key: true },
  });

  return serializeAssignment(updated);
}
