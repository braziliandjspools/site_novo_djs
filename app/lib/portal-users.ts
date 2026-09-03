import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";
import type { PortalPlan, PortalUser as PrismaPortalUser } from "@prisma/client";
import { computeNextDueAt, groupUsersByDueQueue, parseDateInputValue } from "./due-queue";
import { prisma } from "./prisma";

export type { PortalPlan };

export type PortalServices = {
  poolsVip: boolean;
  deemix: boolean;
  allavsoft: boolean;
};

export type PortalUser = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  plan: PortalPlan;
  services: PortalServices;
  monthlyValue: number;
  dueDay: number;
  nextDueAt: Date;
  active: boolean;
  notes: string | null;
  musicProducerDeliveriesEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PortalServicesInput = {
  poolsVip?: boolean;
  deemix?: boolean;
  allavsoft?: boolean;
};

export type CreatePortalUserInput = {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  services?: PortalServicesInput;
  monthlyValue?: number;
  dueDay: number;
  nextDueAt?: string;
  active?: boolean;
  notes?: string;
  /** @deprecated use services */
  plan?: PortalPlan;
};

export type UpdatePortalUserInput = {
  name?: string;
  whatsapp?: string;
  services?: PortalServicesInput;
  monthlyValue?: number;
  dueDay?: number;
  nextDueAt?: string;
  active?: boolean;
  notes?: string | null;
  musicProducerDeliveriesEnabled?: boolean;
  password?: string;
  /** @deprecated use services */
  plan?: PortalPlan;
};

function mapServices(user: PrismaPortalUser): PortalServices {
  return {
    poolsVip: user.servicePoolsVip,
    deemix: user.serviceDeemix,
    allavsoft: user.serviceAllavsoft,
  };
}

function mapUser(user: PrismaPortalUser): PortalUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    plan: user.plan,
    services: mapServices(user),
    monthlyValue: Number(user.monthlyValue),
    dueDay: user.dueDay,
    nextDueAt: user.nextDueAt,
    active: user.active,
    notes: user.notes,
    musicProducerDeliveriesEnabled: user.musicProducerDeliveriesEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function normalizeServices(input?: PortalServicesInput, legacyPlan?: PortalPlan): PortalServices {
  if (input) {
    return {
      poolsVip: Boolean(input.poolsVip),
      deemix: Boolean(input.deemix),
      allavsoft: Boolean(input.allavsoft),
    };
  }

  if (legacyPlan === "VIP") return { poolsVip: true, deemix: false, allavsoft: false };
  if (legacyPlan === "DEEMIX") return { poolsVip: false, deemix: true, allavsoft: false };
  if (legacyPlan === "ALLAVSOFT") return { poolsVip: false, deemix: false, allavsoft: true };
  return { poolsVip: false, deemix: false, allavsoft: false };
}

export function deriveLegacyPlan(services: PortalServices): PortalPlan {
  const count = Number(services.poolsVip) + Number(services.deemix) + Number(services.allavsoft);
  if (count === 0) return "NONE";
  if (services.poolsVip && !services.deemix && !services.allavsoft) return "VIP";
  if (!services.poolsVip && services.deemix && !services.allavsoft) return "DEEMIX";
  if (!services.poolsVip && !services.deemix && services.allavsoft) return "ALLAVSOFT";
  return "NONE";
}

export function getServicesLabel(services: PortalServices) {
  const labels: string[] = [];
  if (services.poolsVip) labels.push("Pools VIP");
  if (services.deemix) labels.push("Deemix");
  if (services.allavsoft) labels.push("Allavsoft");
  return labels.length ? labels.join(" · ") : "Sem serviços";
}

/** @deprecated use getServicesLabel */
export function getPlanLabel(plan: PortalPlan) {
  const labels: Record<PortalPlan, string> = {
    NONE: "Sem serviços",
    VIP: "Pools VIP",
    DEEMIX: "Deemix",
    ALLAVSOFT: "Allavsoft",
  };
  return labels[plan];
}

export function userHasDeemix(user: Pick<PortalUser, "services">) {
  return user.services.deemix;
}

export function userHasAllavsoft(user: Pick<PortalUser, "services">) {
  return user.services.allavsoft;
}

export function userHasPools(user: Pick<PortalUser, "services">) {
  return user.services.poolsVip;
}

export function userHasSubscriptionPlan(user: Pick<PortalUser, "services">) {
  return user.services.poolsVip || user.services.deemix || user.services.allavsoft;
}

export function formatMonthlyValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseMonthlyValue(value: unknown) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Valor mensal inválido.");
  }
  return Math.round(parsed * 100) / 100;
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
  const services = normalizeServices(input.services, input.plan);
  const monthlyValue = parseMonthlyValue(input.monthlyValue);

  const user = await prisma.portalUser.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      whatsapp: input.whatsapp.trim(),
      plan: deriveLegacyPlan(services),
      servicePoolsVip: services.poolsVip,
      serviceDeemix: services.deemix,
      serviceAllavsoft: services.allavsoft,
      monthlyValue: new Decimal(monthlyValue),
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
    dueDay: 1,
    active: true,
    notes: "Cadastro via portal — sem serviços",
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
    servicePoolsVip?: boolean;
    serviceDeemix?: boolean;
    serviceAllavsoft?: boolean;
    monthlyValue?: Decimal;
    dueDay?: number;
    nextDueAt?: Date;
    active?: boolean;
    notes?: string | null;
    musicProducerDeliveriesEnabled?: boolean;
    passwordHash?: string;
  } = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.whatsapp !== undefined) data.whatsapp = input.whatsapp.trim();

  if (input.services !== undefined || input.plan !== undefined) {
    const services = normalizeServices(
      input.services ?? {
        poolsVip: current.servicePoolsVip,
        deemix: current.serviceDeemix,
        allavsoft: current.serviceAllavsoft,
      },
      input.plan,
    );
    data.servicePoolsVip = services.poolsVip;
    data.serviceDeemix = services.deemix;
    data.serviceAllavsoft = services.allavsoft;
    data.plan = deriveLegacyPlan(services);
  }

  if (input.monthlyValue !== undefined) {
    data.monthlyValue = new Decimal(parseMonthlyValue(input.monthlyValue));
  }

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
    planLabel: getServicesLabel(user.services),
    services: user.services,
    servicesLabel: getServicesLabel(user.services),
    monthlyValue: user.monthlyValue,
    monthlyValueLabel: formatMonthlyValue(user.monthlyValue),
    dueDay: user.dueDay,
    nextDueAt: user.nextDueAt.toISOString(),
    active: user.active,
    notes: user.notes,
    musicProducerDeliveriesEnabled: user.musicProducerDeliveriesEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
