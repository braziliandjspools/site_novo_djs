import type { MusicProducerBriefing, MusicProducerBriefingStatus } from "@prisma/client";
import { prisma } from "./prisma";

export type CreateMusicProducerBriefingInput = {
  portalUserId: number;
  name: string;
  email: string;
  whatsapp: string;
  servicePlan: string;
  estimatedQuote?: string;
  idea: string;
  lyrics?: string;
  style?: string;
  occasion?: string;
  deadline?: string;
  deadlineSurcharge?: string;
  additionalNotes?: string;
};

export type UpdateMusicProducerBriefingInput = {
  status?: MusicProducerBriefingStatus;
  adminNote?: string | null;
  idea?: string;
  lyrics?: string | null;
  style?: string | null;
  occasion?: string | null;
  deadline?: string | null;
  deadlineSurcharge?: string | null;
  additionalNotes?: string | null;
  servicePlan?: string;
  estimatedQuote?: string | null;
};

export const MUSIC_PRODUCER_BRIEFING_STATUSES = [
  "PENDENTE",
  "EM_REVISAO",
  "EM_PRODUCAO",
  "EM_EDICAO",
  "CONCLUIDO",
  "EXCLUIDO",
] as const satisfies readonly MusicProducerBriefingStatus[];

export const BRIEFING_STATUS_LABELS: Record<MusicProducerBriefingStatus, string> = {
  PENDENTE: "Pendente",
  EM_REVISAO: "Em revisão",
  EM_PRODUCAO: "Em produção",
  EM_EDICAO: "Em edição",
  CONCLUIDO: "Concluído",
  EXCLUIDO: "Excluído",
};

function formatDateBr(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function serializeMusicProducerBriefing(briefing: MusicProducerBriefing) {
  return {
    id: briefing.id,
    portalUserId: briefing.portalUserId,
    name: briefing.name,
    email: briefing.email,
    whatsapp: briefing.whatsapp,
    servicePlan: briefing.servicePlan,
    estimatedQuote: briefing.estimatedQuote,
    idea: briefing.idea,
    lyrics: briefing.lyrics,
    style: briefing.style,
    occasion: briefing.occasion,
    deadline: briefing.deadline,
    deadlineSurcharge: briefing.deadlineSurcharge,
    additionalNotes: briefing.additionalNotes,
    status: briefing.status,
    statusLabel: BRIEFING_STATUS_LABELS[briefing.status],
    adminNote: briefing.adminNote,
    createdAt: briefing.createdAt.toISOString(),
    createdAtLabel: formatDateBr(briefing.createdAt),
    updatedAt: briefing.updatedAt.toISOString(),
  };
}

export async function createMusicProducerBriefing(input: CreateMusicProducerBriefingInput) {
  const record = await prisma.musicProducerBriefing.create({
    data: {
      portalUserId: input.portalUserId,
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      servicePlan: input.servicePlan,
      estimatedQuote: input.estimatedQuote ?? null,
      idea: input.idea,
      lyrics: input.lyrics ?? null,
      style: input.style ?? null,
      occasion: input.occasion ?? null,
      deadline: input.deadline ?? null,
      deadlineSurcharge: input.deadlineSurcharge ?? null,
      additionalNotes: input.additionalNotes ?? null,
      status: "PENDENTE",
    },
  });

  return serializeMusicProducerBriefing(record);
}

export async function listAllMusicProducerBriefingsGrouped() {
  const briefings = await prisma.musicProducerBriefing.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const byUser = new Map<number, ReturnType<typeof serializeMusicProducerBriefing>[]>();
  for (const briefing of briefings) {
    if (!briefing.portalUserId) continue;
    const serialized = serializeMusicProducerBriefing(briefing);
    const bucket = byUser.get(briefing.portalUserId) ?? [];
    bucket.push(serialized);
    byUser.set(briefing.portalUserId, bucket);
  }

  return [...byUser.entries()].map(([userId, items]) => ({ userId, briefings: items }));
}

export async function listPortalUserBriefings(portalUserId: number) {
  const briefings = await prisma.musicProducerBriefing.findMany({
    where: {
      portalUserId,
      status: { not: "EXCLUIDO" },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return briefings.map(serializeMusicProducerBriefing);
}

export async function updateMusicProducerBriefing(
  id: number,
  input: UpdateMusicProducerBriefingInput,
) {
  const data: Record<string, unknown> = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.adminNote !== undefined) data.adminNote = input.adminNote;
  if (input.idea !== undefined) data.idea = input.idea;
  if (input.lyrics !== undefined) data.lyrics = input.lyrics;
  if (input.style !== undefined) data.style = input.style;
  if (input.occasion !== undefined) data.occasion = input.occasion;
  if (input.deadline !== undefined) data.deadline = input.deadline;
  if (input.deadlineSurcharge !== undefined) data.deadlineSurcharge = input.deadlineSurcharge;
  if (input.additionalNotes !== undefined) data.additionalNotes = input.additionalNotes;
  if (input.servicePlan !== undefined) data.servicePlan = input.servicePlan;
  if (input.estimatedQuote !== undefined) data.estimatedQuote = input.estimatedQuote;

  const record = await prisma.musicProducerBriefing.update({
    where: { id },
    data,
  });
  return serializeMusicProducerBriefing(record);
}

/** Soft-delete: marca como EXCLUIDO. */
export async function softDeleteMusicProducerBriefing(id: number) {
  return updateMusicProducerBriefing(id, {
    status: "EXCLUIDO",
    adminNote: "Pedido excluído pelo admin.",
  });
}

/** Devolve ao cliente para correção. */
export async function returnBriefingToClient(id: number, adminNote?: string) {
  return updateMusicProducerBriefing(id, {
    status: "EM_EDICAO",
    adminNote: adminNote?.trim() || "Corrija os dados do pedido e reenvie.",
  });
}

export async function getMusicProducerBriefingById(id: number) {
  return prisma.musicProducerBriefing.findUnique({ where: { id } });
}

export function isBriefingStatus(value: string): value is MusicProducerBriefingStatus {
  return (MUSIC_PRODUCER_BRIEFING_STATUSES as readonly string[]).includes(value);
}
