import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";
import type { PortalPlan, PortalUser as PrismaPortalUser } from "@prisma/client";
import { defaultNextDueAt, parseDateInputValue } from "./due-queue";
import { prisma } from "./prisma";

export type { PortalPlan };

export type PortalServices = {
  poolsVip: boolean;
  deemix: boolean;
  allavsoft: boolean;
};

export type ServiceLineBilling = {
  value: number;
  /** null = sem vencimento (ex.: Allavsoft vitalícia). */
  dueAt: Date | null;
};

export type ServiceBilling = {
  poolsVip: ServiceLineBilling;
  deemix: ServiceLineBilling;
  allavsoft: ServiceLineBilling;
};

export type ServiceLineBillingInput = {
  value?: number;
  dueAt?: string | null;
};

export type ServiceBillingInput = {
  poolsVip?: ServiceLineBillingInput;
  deemix?: ServiceLineBillingInput;
  allavsoft?: ServiceLineBillingInput;
};

export type PortalUser = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  plan: PortalPlan;
  services: PortalServices;
  serviceBilling: ServiceBilling;
  monthlyValue: number;
  nextDueAt: Date;
  active: boolean;
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
  serviceBilling?: ServiceBillingInput;
  /** @deprecated prefer serviceBilling — distribuído aos serviços ativos. */
  monthlyValue?: number;
  /** @deprecated prefer serviceBilling */
  nextDueAt?: string;
  active?: boolean;
  /** @deprecated use services */
  plan?: PortalPlan;
};

export type UpdatePortalUserInput = {
  name?: string;
  email?: string;
  whatsapp?: string;
  services?: PortalServicesInput;
  serviceBilling?: ServiceBillingInput;
  /** @deprecated prefer serviceBilling */
  monthlyValue?: number;
  /** @deprecated prefer serviceBilling */
  nextDueAt?: string;
  active?: boolean;
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

function mapServiceBilling(user: PrismaPortalUser): ServiceBilling {
  return {
    poolsVip: {
      value: Number(user.servicePoolsVipValue),
      dueAt: user.servicePoolsVipDueAt,
    },
    deemix: {
      value: Number(user.serviceDeemixValue),
      dueAt: user.serviceDeemixDueAt,
    },
    allavsoft: {
      value: Number(user.serviceAllavsoftValue),
      dueAt: user.serviceAllavsoftDueAt,
    },
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
    serviceBilling: mapServiceBilling(user),
    monthlyValue: Number(user.monthlyValue),
    nextDueAt: user.nextDueAt,
    active: user.active,
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

export function formatMonthlyValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseMonthlyValue(value: unknown) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Valor mensal inválido.");
  }
  return Math.round(parsed * 100) / 100;
}

function parseOptionalDueAt(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  return parseDateInputValue(value);
}

export function computeAggregateMonthlyValue(services: PortalServices, billing: ServiceBilling): number {
  let total = 0;
  if (services.poolsVip) total += billing.poolsVip.value;
  if (services.deemix) total += billing.deemix.value;
  if (services.allavsoft) total += billing.allavsoft.value;
  return Math.round(total * 100) / 100;
}

export function computeAggregateNextDueAt(
  services: PortalServices,
  billing: ServiceBilling,
  fallback: Date = defaultNextDueAt(),
): Date {
  const dues: Date[] = [];
  if (services.poolsVip && billing.poolsVip.dueAt) dues.push(billing.poolsVip.dueAt);
  if (services.deemix && billing.deemix.dueAt) dues.push(billing.deemix.dueAt);
  if (services.allavsoft && billing.allavsoft.dueAt) dues.push(billing.allavsoft.dueAt);
  if (dues.length === 0) return fallback;
  return new Date(Math.min(...dues.map((d) => d.getTime())));
}

function mergeServiceBilling(
  base: ServiceBilling,
  patch: ServiceBillingInput | undefined,
): ServiceBilling {
  if (!patch) return base;
  const next: ServiceBilling = {
    poolsVip: { ...base.poolsVip },
    deemix: { ...base.deemix },
    allavsoft: { ...base.allavsoft },
  };
  for (const key of ["poolsVip", "deemix", "allavsoft"] as const) {
    const line = patch[key];
    if (!line) continue;
    if (line.value !== undefined) next[key].value = parseMonthlyValue(line.value);
    if (line.dueAt !== undefined) {
      const due = parseOptionalDueAt(line.dueAt);
      next[key].dueAt = due === undefined ? next[key].dueAt : due;
    }
  }
  return next;
}

function emptyBilling(): ServiceBilling {
  return {
    poolsVip: { value: 0, dueAt: null },
    deemix: { value: 0, dueAt: null },
    allavsoft: { value: 0, dueAt: null },
  };
}

/** Distribui valor/vencimento legados nos serviços ativos (criação / migração suave). */
function billingFromLegacy(
  services: PortalServices,
  monthlyValue: number,
  nextDueAt: Date,
  existing?: ServiceBilling,
): ServiceBilling {
  const billing = existing ? { ...existing, poolsVip: { ...existing.poolsVip }, deemix: { ...existing.deemix }, allavsoft: { ...existing.allavsoft } } : emptyBilling();
  const activeCount = Number(services.poolsVip) + Number(services.deemix) + Number(services.allavsoft);
  if (activeCount === 0) return billing;

  if (services.poolsVip) {
    billing.poolsVip = {
      value: billing.poolsVip.value > 0 ? billing.poolsVip.value : monthlyValue,
      dueAt: billing.poolsVip.dueAt ?? nextDueAt,
    };
  }
  if (services.deemix) {
    billing.deemix = {
      value:
        billing.deemix.value > 0
          ? billing.deemix.value
          : services.poolsVip
            ? billing.deemix.value
            : monthlyValue,
      dueAt: billing.deemix.dueAt ?? nextDueAt,
    };
  }
  if (services.allavsoft) {
    billing.allavsoft = {
      value:
        billing.allavsoft.value > 0
          ? billing.allavsoft.value
          : !services.poolsVip && !services.deemix
            ? monthlyValue
            : billing.allavsoft.value,
      dueAt: billing.allavsoft.dueAt,
    };
  }
  return billing;
}

function prismaBillingData(services: PortalServices, billing: ServiceBilling, aggregateFallbackDue: Date) {
  const monthlyValue = computeAggregateMonthlyValue(services, billing);
  const nextDueAt = computeAggregateNextDueAt(services, billing, aggregateFallbackDue);
  // Valores e vencimentos ficam gravados mesmo com o serviço desligado,
  // para o admin editar preços sem o total “puxar” o que não está ativo.
  return {
    servicePoolsVipValue: new Decimal(billing.poolsVip.value),
    servicePoolsVipDueAt: billing.poolsVip.dueAt,
    serviceDeemixValue: new Decimal(billing.deemix.value),
    serviceDeemixDueAt: billing.deemix.dueAt,
    serviceAllavsoftValue: new Decimal(billing.allavsoft.value),
    serviceAllavsoftDueAt: billing.allavsoft.dueAt,
    monthlyValue: new Decimal(monthlyValue),
    nextDueAt,
  };
}

function isDueActive(dueAt: Date | null, now = new Date()) {
  if (!dueAt) return true;
  return dueAt.getTime() > now.getTime();
}

export function userHasDeemix(user: Pick<PortalUser, "services" | "serviceBilling">, now = new Date()) {
  return user.services.deemix && isDueActive(user.serviceBilling.deemix.dueAt, now);
}

export function userHasAllavsoft(user: Pick<PortalUser, "services">) {
  return user.services.allavsoft;
}

export function userHasPools(user: Pick<PortalUser, "services" | "serviceBilling" | "nextDueAt">, now = new Date()) {
  if (!user.services.poolsVip) return false;
  const due = user.serviceBilling?.poolsVip.dueAt ?? user.nextDueAt;
  return isDueActive(due, now);
}

export function userHasSubscriptionPlan(user: Pick<PortalUser, "services">) {
  return user.services.poolsVip || user.services.deemix || user.services.allavsoft;
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
  const legacyDue = input.nextDueAt ? parseDateInputValue(input.nextDueAt) : defaultNextDueAt();
  const services = normalizeServices(input.services, input.plan);
  const legacyValue = parseMonthlyValue(input.monthlyValue);
  let billing = billingFromLegacy(services, legacyValue, legacyDue);
  billing = mergeServiceBilling(billing, input.serviceBilling);
  const prismaBilling = prismaBillingData(services, billing, legacyDue);

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
      ...prismaBilling,
      active: input.active !== false,
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
    active: true,
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

  const currentMapped = mapUser(current);
  let services = currentMapped.services;
  if (input.services !== undefined || input.plan !== undefined) {
    services = normalizeServices(
      input.services ?? {
        poolsVip: current.servicePoolsVip,
        deemix: current.serviceDeemix,
        allavsoft: current.serviceAllavsoft,
      },
      input.plan,
    );
  }

  let billing = currentMapped.serviceBilling;
  if (input.serviceBilling) {
    billing = mergeServiceBilling(billing, input.serviceBilling);
  } else if (input.monthlyValue !== undefined || input.nextDueAt !== undefined) {
    // Legado: se só vierem agregados, redistribui no primeiro serviço ativo.
    const legacyValue =
      input.monthlyValue !== undefined ? parseMonthlyValue(input.monthlyValue) : currentMapped.monthlyValue;
    const legacyDue = input.nextDueAt !== undefined ? parseDateInputValue(input.nextDueAt) : currentMapped.nextDueAt;
    billing = billingFromLegacy(services, legacyValue, legacyDue, billing);
  }

  const prismaBilling = prismaBillingData(services, billing, currentMapped.nextDueAt);

  const data: Record<string, unknown> = {
    servicePoolsVip: services.poolsVip,
    serviceDeemix: services.deemix,
    serviceAllavsoft: services.allavsoft,
    plan: deriveLegacyPlan(services),
    ...prismaBilling,
  };

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new Error("E-mail inválido.");
    }
    const existing = await prisma.portalUser.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      throw new Error("Este e-mail já está cadastrado.");
    }
    data.email = email;
  }
  if (input.whatsapp !== undefined) data.whatsapp = input.whatsapp.trim();
  if (input.active !== undefined) data.active = input.active;
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

export async function listPortalUsersForAdmin() {
  const users = await listPortalUsersByQueue();
  return {
    users: users.map(serializePortalUser),
    total: users.length,
  };
}

function serializeLine(line: ServiceLineBilling) {
  return {
    value: line.value,
    valueLabel: formatMonthlyValue(line.value),
    dueAt: line.dueAt ? line.dueAt.toISOString() : null,
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
    serviceBilling: {
      poolsVip: serializeLine(user.serviceBilling.poolsVip),
      deemix: serializeLine(user.serviceBilling.deemix),
      allavsoft: serializeLine(user.serviceBilling.allavsoft),
    },
    monthlyValue: user.monthlyValue,
    monthlyValueLabel: formatMonthlyValue(user.monthlyValue),
    nextDueAt: user.nextDueAt.toISOString(),
    active: user.active,
    musicProducerDeliveriesEnabled: user.musicProducerDeliveriesEnabled,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
