import type { MusicProducerBriefing } from "@prisma/client";
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
    createdAt: briefing.createdAt.toISOString(),
    createdAtLabel: formatDateBr(briefing.createdAt),
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
