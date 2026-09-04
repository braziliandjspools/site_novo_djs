import type { SiteNotice, SiteNoticeAudience, SiteNoticeSeverity } from "@prisma/client";
import { prisma } from "./prisma";
import { buildPlanBillingPayload } from "./plan-billing";
import type { PortalUser } from "./portal-users";
import { formatDueDate } from "./due-queue";

export type SiteNotificationKind = "admin" | "payment" | "info";
export type SiteNotificationSeverity = "info" | "success" | "warning" | "error";

export type SiteNotificationAction =
  | { type: "portal"; label: string }
  | { type: "plans"; label: string }
  | { type: "url"; label: string; href: string };

export type SiteNotificationDto = {
  id: string;
  kind: SiteNotificationKind;
  title: string;
  body: string;
  severity: SiteNotificationSeverity;
  createdAt: string;
  read: boolean;
  action?: SiteNotificationAction;
  dedupeKey?: string;
};

function mapSeverity(value: SiteNoticeSeverity): SiteNotificationSeverity {
  switch (value) {
    case "SUCCESS":
      return "success";
    case "WARNING":
      return "warning";
    case "ERROR":
      return "error";
    default:
      return "info";
  }
}

function noticeIsLive(notice: Pick<SiteNotice, "active" | "startsAt" | "endsAt">, now = new Date()) {
  if (!notice.active) return false;
  if (notice.startsAt && notice.startsAt > now) return false;
  if (notice.endsAt && notice.endsAt < now) return false;
  return true;
}

function paymentNotifications(user: PortalUser): SiteNotificationDto[] {
  const billing = buildPlanBillingPayload(user);
  if (billing.status === "none" || billing.status === "ok") return [];

  if (billing.expired) {
    return [
      {
        id: "payment:expired",
        kind: "payment",
        title: "Pagamento / plano vencido",
        body: `Seu plano venceu em ${billing.nextDueLabel}. Renove para manter o acesso VIP.`,
        severity: "error",
        createdAt: new Date().toISOString(),
        read: false,
        action: { type: "plans", label: "Ver planos" },
        dedupeKey: "payment:expired",
      },
    ];
  }

  const days = billing.daysUntilDue;
  let body = `Seu plano vence em ${days} dias (${billing.nextDueLabel}).`;
  if (days <= 0) body = `Seu plano vence hoje (${billing.nextDueLabel}).`;
  else if (days === 1) body = `Seu plano vence amanhã (${billing.nextDueLabel}).`;

  if (days > 5) return [];

  return [
    {
      id: `payment:expiring:${days}`,
      kind: "payment",
      title: "Aviso de pagamento",
      body,
      severity: "warning",
      createdAt: new Date().toISOString(),
      read: false,
      action: { type: "plans", label: "Ver planos" },
      dedupeKey: `payment:expiring:${billing.nextDueAt}`,
    },
  ];
}

export async function listActiveNoticesForUser(userId: number | null) {
  const now = new Date();
  const notices = await prisma.siteNotice.findMany({
    where: {
      active: true,
      OR: userId
        ? [{ audience: "GLOBAL" }, { audience: "USER", portalUserId: userId }]
        : [{ audience: "GLOBAL" }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return notices.filter((notice) => noticeIsLive(notice, now));
}

export async function buildSiteNotifications(user: PortalUser | null): Promise<SiteNotificationDto[]> {
  const userId = user?.id ?? null;
  const notices = await listActiveNoticesForUser(userId);

  const receipts =
    userId == null
      ? []
      : await prisma.siteNoticeReceipt.findMany({
          where: {
            portalUserId: userId,
            noticeId: { in: notices.map((n) => n.id) },
          },
        });

  const receiptByNotice = new Map(receipts.map((r) => [r.noticeId, r]));

  const adminItems: SiteNotificationDto[] = notices
    .filter((notice) => {
      const receipt = receiptByNotice.get(notice.id);
      return !receipt?.dismissedAt;
    })
    .map((notice) => {
      const receipt = receiptByNotice.get(notice.id);
      return {
        id: `notice:${notice.id}`,
        kind: "admin" as const,
        title: notice.title,
        body: notice.body,
        severity: mapSeverity(notice.severity),
        createdAt: notice.createdAt.toISOString(),
        read: Boolean(receipt?.readAt),
        action: { type: "portal" as const, label: "Abrir Portal" },
        dedupeKey: `notice:${notice.id}`,
      };
    });

  const payments = user ? paymentNotifications(user) : [];

  return [...payments, ...adminItems].slice(0, 40);
}

export type CreateSiteNoticeInput = {
  title: string;
  body: string;
  severity?: SiteNoticeSeverity;
  audience: SiteNoticeAudience;
  portalUserId?: number | null;
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export async function listSiteNoticesForAdmin() {
  const notices = await prisma.siteNotice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      portalUser: { select: { id: true, name: true, email: true } },
      _count: { select: { receipts: true } },
    },
    take: 100,
  });

  return notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    severity: notice.severity,
    audience: notice.audience,
    portalUserId: notice.portalUserId,
    user: notice.portalUser
      ? { id: notice.portalUser.id, name: notice.portalUser.name, email: notice.portalUser.email }
      : null,
    active: notice.active,
    startsAt: notice.startsAt?.toISOString() ?? null,
    endsAt: notice.endsAt?.toISOString() ?? null,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
    receiptsCount: notice._count.receipts,
  }));
}

export async function createSiteNotice(input: CreateSiteNoticeInput) {
  if (input.audience === "USER" && !input.portalUserId) {
    throw new Error("Avisos individuais precisam de um usuário.");
  }

  return prisma.siteNotice.create({
    data: {
      title: input.title.trim(),
      body: input.body.trim(),
      severity: input.severity ?? "INFO",
      audience: input.audience,
      portalUserId: input.audience === "USER" ? input.portalUserId : null,
      active: input.active ?? true,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    },
  });
}

export async function updateSiteNotice(
  id: number,
  input: Partial<CreateSiteNoticeInput> & { active?: boolean },
) {
  const existing = await prisma.siteNotice.findUnique({ where: { id } });
  if (!existing) return null;

  const audience = input.audience ?? existing.audience;
  const portalUserId =
    audience === "USER"
      ? (input.portalUserId !== undefined ? input.portalUserId : existing.portalUserId)
      : null;

  if (audience === "USER" && !portalUserId) {
    throw new Error("Avisos individuais precisam de um usuário.");
  }

  return prisma.siteNotice.update({
    where: { id },
    data: {
      title: input.title?.trim() ?? undefined,
      body: input.body?.trim() ?? undefined,
      severity: input.severity,
      audience,
      portalUserId,
      active: input.active,
      startsAt: input.startsAt === undefined ? undefined : input.startsAt,
      endsAt: input.endsAt === undefined ? undefined : input.endsAt,
    },
  });
}

export async function deleteSiteNotice(id: number) {
  await prisma.siteNotice.delete({ where: { id } });
}

export async function markNoticeRead(noticeId: number, portalUserId: number) {
  await prisma.siteNoticeReceipt.upsert({
    where: { noticeId_portalUserId: { noticeId, portalUserId } },
    create: { noticeId, portalUserId, readAt: new Date() },
    update: { readAt: new Date() },
  });
}

export async function markAllNoticesRead(portalUserId: number, noticeIds: number[]) {
  if (noticeIds.length === 0) return;
  const now = new Date();
  await Promise.all(
    noticeIds.map((noticeId) =>
      prisma.siteNoticeReceipt.upsert({
        where: { noticeId_portalUserId: { noticeId, portalUserId } },
        create: { noticeId, portalUserId, readAt: now },
        update: { readAt: now },
      }),
    ),
  );
}

export async function dismissNotice(noticeId: number, portalUserId: number) {
  const now = new Date();
  await prisma.siteNoticeReceipt.upsert({
    where: { noticeId_portalUserId: { noticeId, portalUserId } },
    create: { noticeId, portalUserId, readAt: now, dismissedAt: now },
    update: { readAt: now, dismissedAt: now },
  });
}

export function parseNoticeId(id: string): number | null {
  const match = id.match(/^notice:(\d+)$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function formatNoticeAudienceLabel(audience: SiteNoticeAudience, userEmail?: string | null) {
  if (audience === "GLOBAL") return "Todos os usuários";
  return userEmail ? `Usuário: ${userEmail}` : "Usuário específico";
}

export function formatNoticeCreatedLabel(iso: string) {
  return formatDueDate(iso);
}
