import bcrypt from "bcryptjs";
import type { PortalPlan, PortalUser as PrismaPortalUser } from "@prisma/client";
import { computeNextDueAt, groupUsersByDueQueue, parseDateInputValue } from "./due-queue";
import { prisma } from "./prisma";

export type { PortalPlan };

export type PortalUser = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  plan: PortalPlan;
  dueDay: number;
  nextDueAt: Date;
  active: boolean;
  notes: string | null;
  musicProducerDeliveriesEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePortalUserInput = {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  plan: PortalPlan;
  dueDay: number;
  nextDueAt?: string;
  active?: boolean;
  notes?: string;
};

export type UpdatePortalUserInput = {
  name?: string;
  whatsapp?: string;
  plan?: PortalPlan;
  dueDay?: number;
  nextDueAt?: string;
  active?: boolean;
  notes?: string | null;
  musicProducerDeliveriesEnabled?: boolean;
  password?: string;
};

const PLAN_LABELS: Record<PortalPlan, string> = {
  NONE: "Sem plano ativo",
  VIP: "VIP — Pools + Deemix + Allavsoft",
  DEEMIX: "Deemix",
  ALLAVSOFT: "Allavsoft",
};

function mapUser(user: PrismaPortalUser): PortalUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    plan: user.plan,
    dueDay: user.dueDay,
    nextDueAt: user.nextDueAt,
    active: user.active,
    notes: user.notes,
    musicProducerDeliveriesEnabled: user.musicProducerDeliveriesEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function getPlanLabel(plan: PortalPlan) {
  return PLAN_LABELS[plan];
}

export function userHasDeemix(plan: PortalPlan) {
  return plan === "VIP" || plan === "DEEMIX";
}

export function userHasAllavsoft(plan: PortalPlan) {
  return plan === "VIP" || plan === "ALLAVSOFT";
}

export function userHasPools(plan: PortalPlan) {
  return plan === "VIP";
}

export function userHasSubscriptionPlan(plan: PortalPlan) {
  return plan !== "NONE";
}

export async function findUserByEmail(email: string) {
  const user = await prisma.portalUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  return user ? mapUser(user) : null;
}

export async function findUserById(id: number) {
  const user = await prisma.portalUser.findUnique({ where: { id } });
  return user ? mapUser(user) : null;
}

export async function findUserPasswordHash(email: string) {
  const user = await prisma.portalUser.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { passwordHash: true },
  });
  return user?.passwordHash ?? null;
}

export async function verifyUserPassword(email: string, password: string) {
  const hash = await findUserPasswordHash(email);
  if (!hash) return null;

  const valid = await bcrypt.compare(password, hash);
  if (!valid) return null;

  return findUserByEmail(email);
}

export async function createPortalUser(input: CreatePortalUserInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const nextDueAt = input.nextDueAt
    ? parseDateInputValue(input.nextDueAt)
    : computeNextDueAt(input.dueDay);

  const user = await prisma.portalUser.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      whatsapp: input.whatsapp.trim(),
      plan: input.plan,
      dueDay: input.dueDay,
      nextDueAt,
      active: input.active !== false,
      notes: input.notes?.trim() || null,
    },
  });

  return mapUser(user);
}

export type RegisterPortalUserInput = {
  name: string;
  email: string;
  whatsapp: string;
  password: string;
};

export async function registerPortalUser(input: RegisterPortalUserInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.portalUser.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Este e-mail já possui cadastro. Faça login.");
  }

  return createPortalUser({
    name: input.name,
    email,
    whatsapp: input.whatsapp,
    password: input.password,
    plan: "NONE",
    dueDay: 1,
    active: true,
    notes: "Cadastro via portal — sem plano",
  });
}

export async function listPortalUsersByQueue() {
  const users = await prisma.portalUser.findMany({
    orderBy: [{ nextDueAt: "asc" }, { id: "asc" }],
  });

  return users.map(mapUser);
}

export async function updatePortalUser(id: number, input: UpdatePortalUserInput) {
  const current = await prisma.portalUser.findUnique({ where: { id } });
  if (!current) return null;

  const data: {
    name?: string;
    whatsapp?: string;
    plan?: PortalPlan;
    dueDay?: number;
    nextDueAt?: Date;
    active?: boolean;
    notes?: string | null;
    musicProducerDeliveriesEnabled?: boolean;
    passwordHash?: string;
  } = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.whatsapp !== undefined) data.whatsapp = input.whatsapp.trim();
  if (input.plan !== undefined) data.plan = input.plan;
  if (input.dueDay !== undefined) data.dueDay = input.dueDay;
  if (input.nextDueAt !== undefined) {
    data.nextDueAt = parseDateInputValue(input.nextDueAt);
  } else if (input.dueDay !== undefined) {
    data.nextDueAt = computeNextDueAt(input.dueDay);
  }
  if (input.active !== undefined) data.active = input.active;
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
  if (input.musicProducerDeliveriesEnabled !== undefined) {
    data.musicProducerDeliveriesEnabled = input.musicProducerDeliveriesEnabled;
  }
  if (input.password) data.passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.portalUser.update({
    where: { id },
    data,
  });

  return mapUser(user);
}

export async function deletePortalUser(id: number) {
  await prisma.portalUser.delete({ where: { id } });
}

export async function listPortalUsersGrouped() {
  const users = await listPortalUsersByQueue();
  const serialized = users.map(serializePortalUser);
  const groups = groupUsersByDueQueue(serialized);

  return {
    groups,
    total: users.length,
  };
}

export function serializePortalUser(user: PortalUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    plan: user.plan,
    planLabel: getPlanLabel(user.plan),
    dueDay: user.dueDay,
    nextDueAt: user.nextDueAt.toISOString(),
    active: user.active,
    notes: user.notes,
    musicProducerDeliveriesEnabled: user.musicProducerDeliveriesEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
