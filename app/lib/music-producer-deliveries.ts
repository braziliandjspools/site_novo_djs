import type { MusicProducerDelivery as PrismaDelivery } from "@prisma/client";
import type { PortalUser } from "./portal-users";
import { parseDateInputValue, toDateInputValue } from "./due-queue";
import {
  fromPrismaRedoReason,
  parseDeliveryRedoReason,
  redoReasonLabel,
  toPrismaRedoReason,
  type DeliveryRedoReason,
} from "./music-producer-delivery-feedback";
import { prisma } from "./prisma";

export type MusicProducerDeliveryRecord = {
  id: number;
  portalUserId: number;
  title: string;
  servicePlan: string | null;
  chargedAmount: string | null;
  orderDate: Date;
  releasedAt: Date | null;
  downloadUrl: string;
  notes: string | null;
  visible: boolean;
  clientRating: number | null;
  clientReview: string | null;
  redoRequested: boolean;
  redoReason: DeliveryRedoReason | null;
  redoNotes: string | null;
  redoRequestedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMusicProducerDeliveryInput = {
  portalUserId: number;
  title: string;
  servicePlan?: string;
  chargedAmount?: string;
  orderDate: string;
  releasedAt?: string | null;
  downloadUrl: string;
  notes?: string;
  visible?: boolean;
};

export type UpdateMusicProducerDeliveryInput = {
  title?: string;
  servicePlan?: string | null;
  chargedAmount?: string | null;
  orderDate?: string;
  releasedAt?: string | null;
  downloadUrl?: string;
  notes?: string | null;
  visible?: boolean;
};

function getDeliveryDelegate() {
  const delegate = (prisma as { musicProducerDelivery?: typeof prisma.portalUser }).musicProducerDelivery;
  if (!delegate) {
    throw new Error(
      "Banco de entregas não inicializado. Rode `npm run db:push`, depois `npx prisma generate` e reinicie o servidor.",
    );
  }
  return delegate;
}

function mapDelivery(record: PrismaDelivery): MusicProducerDeliveryRecord {
  return {
    id: record.id,
    portalUserId: record.portalUserId,
    title: record.title,
    servicePlan: record.servicePlan,
    chargedAmount: record.chargedAmount,
    orderDate: record.orderDate,
    releasedAt: record.releasedAt,
    downloadUrl: record.downloadUrl,
    notes: record.notes,
    visible: record.visible,
    clientRating: record.clientRating,
    clientReview: record.clientReview,
    redoRequested: record.redoRequested,
    redoReason: fromPrismaRedoReason(record.redoReason),
    redoNotes: record.redoNotes,
    redoRequestedAt: record.redoRequestedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parseOptionalDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null || !value.trim()) return null;
  return parseDateInputValue(value);
}

function isReleased(delivery: MusicProducerDeliveryRecord, now = new Date()) {
  if (!delivery.releasedAt) return false;
  return delivery.releasedAt.getTime() <= now.getTime();
}

export function serializeMusicProducerDelivery(delivery: MusicProducerDeliveryRecord, forPortal = false) {
  const released = isReleased(delivery);
  return {
    id: delivery.id,
    title: delivery.title,
    servicePlan: delivery.servicePlan,
    chargedAmount: delivery.chargedAmount,
    orderDate: delivery.orderDate.toISOString(),
    orderDateLabel: formatDateBr(delivery.orderDate),
    releasedAt: delivery.releasedAt?.toISOString() ?? null,
    releasedAtLabel: delivery.releasedAt ? formatDateBr(delivery.releasedAt) : null,
    downloadUrl: forPortal && !released ? null : delivery.downloadUrl,
    downloadApiUrl:
      forPortal && released ? `/api/portal/music-producer/deliveries/${delivery.id}/download` : null,
    playUrl: forPortal && released ? `/api/portal/music-producer/deliveries/${delivery.id}/audio` : null,
    notes: delivery.notes,
    visible: delivery.visible,
    clientRating: delivery.clientRating,
    clientReview: delivery.clientReview,
    redoRequested: delivery.redoRequested,
    redoReason: delivery.redoReason,
    redoReasonLabel: redoReasonLabel(delivery.redoReason),
    redoNotes: delivery.redoNotes,
    redoRequestedAt: delivery.redoRequestedAt?.toISOString() ?? null,
    canReview: forPortal && released,
    status: !delivery.visible ? "hidden" : released ? "released" : "in_progress",
    statusLabel: !delivery.visible ? "Oculto" : released ? "Liberado" : "Em produção",
    createdAt: delivery.createdAt.toISOString(),
    updatedAt: delivery.updatedAt.toISOString(),
  };
}

function formatDateBr(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function listMusicProducerDeliveriesForUser(portalUserId: number) {
  const records = await getDeliveryDelegate().findMany({
    where: { portalUserId },
    orderBy: [{ orderDate: "desc" }, { id: "desc" }],
  });
  return records.map(mapDelivery);
}

export async function getPortalUserDeliveryForPlayback(user: PortalUser, deliveryId: number) {
  const delivery = await getDeliveryDelegate().findFirst({
    where: { id: deliveryId, portalUserId: user.id, visible: true },
  });
  if (!delivery) return null;

  const mapped = mapDelivery(delivery);
  if (!isReleased(mapped)) return null;
  return mapped;
}

export type SubmitDeliveryFeedbackInput = {
  rating?: number;
  review?: string;
  requestRedo?: boolean;
  redoReason?: DeliveryRedoReason;
  redoNotes?: string;
};

export async function submitPortalDeliveryFeedback(
  user: PortalUser,
  deliveryId: number,
  input: SubmitDeliveryFeedbackInput,
) {
  const delivery = await getPortalUserDeliveryForPlayback(user, deliveryId);
  if (!delivery) {
    throw new Error("Entrega não encontrada ou ainda não liberada.");
  }

  const rating = input.rating;
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error("A avaliação deve ser de 1 a 5 estrelas.");
  }

  const requestRedo = input.requestRedo === true;
  const redoReason = requestRedo ? parseDeliveryRedoReason(input.redoReason) : null;
  if (requestRedo && !redoReason) {
    throw new Error("Informe se o erro foi da IA, do produtor ou de ambos.");
  }

  const redoNotes = input.redoNotes?.trim() ?? "";
  if (requestRedo && redoNotes.length < 10) {
    throw new Error("Descreva o motivo do refazer com pelo menos 10 caracteres.");
  }

  const data: {
    clientRating?: number;
    clientReview?: string | null;
    redoRequested?: boolean;
    redoReason?: "AI" | "PRODUCER" | "BOTH" | null;
    redoNotes?: string | null;
    redoRequestedAt?: Date | null;
  } = {};

  if (rating !== undefined) data.clientRating = rating;
  if (input.review !== undefined) data.clientReview = input.review.trim() || null;

  if (requestRedo) {
    data.redoRequested = true;
    data.redoReason = toPrismaRedoReason(redoReason!);
    data.redoNotes = redoNotes;
    data.redoRequestedAt = new Date();
  }

  const record = await getDeliveryDelegate().update({
    where: { id: deliveryId },
    data,
  });

  return mapDelivery(record);
}

export async function clearDeliveryRedoRequest(id: number) {
  const record = await getDeliveryDelegate().update({
    where: { id },
    data: {
      redoRequested: false,
      redoReason: null,
      redoNotes: null,
      redoRequestedAt: null,
    },
  });
  return mapDelivery(record);
}

export async function getPortalUserDeliveries(user: PortalUser) {
  if (!user.musicProducerDeliveriesEnabled) {
    return { enabled: false, deliveries: [] };
  }

  const records = await listMusicProducerDeliveriesForUser(user.id);
  const deliveries = records.filter((delivery) => delivery.visible).map((d) => serializeMusicProducerDelivery(d, true));

  return {
    enabled: true,
    deliveries,
  };
}

export async function createMusicProducerDelivery(input: CreateMusicProducerDeliveryInput) {
  const record = await getDeliveryDelegate().create({
    data: {
      portalUserId: input.portalUserId,
      title: input.title.trim(),
      servicePlan: input.servicePlan?.trim() || null,
      chargedAmount: input.chargedAmount?.trim() || null,
      orderDate: parseDateInputValue(input.orderDate),
      releasedAt: parseOptionalDate(input.releasedAt) ?? null,
      downloadUrl: input.downloadUrl.trim(),
      notes: input.notes?.trim() || null,
      visible: input.visible === true,
    },
  });
  return mapDelivery(record);
}

export async function updateMusicProducerDelivery(id: number, input: UpdateMusicProducerDeliveryInput) {
  const current = await getDeliveryDelegate().findUnique({ where: { id } });
  if (!current) return null;

  const record = await getDeliveryDelegate().update({
    where: { id },
    data: {
      title: input.title?.trim(),
      servicePlan: input.servicePlan === undefined ? undefined : input.servicePlan?.trim() || null,
      chargedAmount:
        input.chargedAmount === undefined ? undefined : input.chargedAmount?.trim() || null,
      orderDate: input.orderDate ? parseDateInputValue(input.orderDate) : undefined,
      releasedAt:
        input.releasedAt !== undefined ? (parseOptionalDate(input.releasedAt) ?? null) : undefined,
      downloadUrl: input.downloadUrl?.trim(),
      notes: input.notes === undefined ? undefined : input.notes?.trim() || null,
      visible: input.visible,
    },
  });

  return mapDelivery(record);
}

export async function deleteMusicProducerDelivery(id: number) {
  await getDeliveryDelegate().delete({ where: { id } });
}

export async function listAllMusicProducerDeliveriesGrouped() {
  const [users, deliveries] = await Promise.all([
    prisma.portalUser.findMany({ orderBy: [{ nextDueAt: "asc" }, { id: "asc" }] }),
    getDeliveryDelegate().findMany({ orderBy: [{ orderDate: "desc" }, { id: "desc" }] }),
  ]);

  const byUser = new Map<number, MusicProducerDeliveryRecord[]>();
  for (const record of deliveries) {
    const mapped = mapDelivery(record);
    const bucket = byUser.get(record.portalUserId) ?? [];
    bucket.push(mapped);
    byUser.set(record.portalUserId, bucket);
  }

  return users.map((user) => ({
    userId: user.id,
    deliveries: (byUser.get(user.id) ?? []).map(serializeMusicProducerDelivery),
  }));
}

export function toDeliveryDateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  return toDateInputValue(date);
}
