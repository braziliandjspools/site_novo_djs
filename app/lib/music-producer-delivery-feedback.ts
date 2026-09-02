import type { MusicProducerRedoReason } from "@prisma/client";

export type DeliveryRedoReason = "ai" | "producer" | "both";

export function parseDeliveryRedoReason(value: unknown): DeliveryRedoReason | null {
  if (value === "ai" || value === "producer" || value === "both") return value;
  return null;
}

export function toPrismaRedoReason(value: DeliveryRedoReason): MusicProducerRedoReason {
  if (value === "ai") return "AI";
  if (value === "producer") return "PRODUCER";
  return "BOTH";
}

export function fromPrismaRedoReason(value: MusicProducerRedoReason | null): DeliveryRedoReason | null {
  if (value === "AI") return "ai";
  if (value === "PRODUCER") return "producer";
  if (value === "BOTH") return "both";
  return null;
}

export function redoReasonLabel(value: DeliveryRedoReason | null) {
  if (value === "ai") return "Erro da IA";
  if (value === "producer") return "Erro do produtor";
  if (value === "both") return "Erro da IA e do produtor";
  return null;
}
