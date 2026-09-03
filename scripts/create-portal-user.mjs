#!/usr/bin/env node

import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function clampDueDay(dueDay, year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  return Math.min(Math.max(1, dueDay), lastDay);
}

function getSaoPauloDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const read = (type) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day") };
}

function computeNextDueAt(dueDay, reference = new Date()) {
  const { year, month, day } = getSaoPauloDateParts(reference);
  const thisMonthDay = clampDueDay(dueDay, year, month);

  if (thisMonthDay > day) {
    return new Date(Date.UTC(year, month - 1, thisMonthDay, 12, 0, 0));
  }

  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  const nextMonthDay = clampDueDay(dueDay, nextYear, nextMonth);
  return new Date(Date.UTC(nextYear, nextMonth - 1, nextMonthDay, 12, 0, 0));
}

function parseServices(raw) {
  const value = String(raw ?? "")
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

  return {
    servicePoolsVip: value.includes("POOLS") || value.includes("VIP") || value.includes("POOLS_VIP"),
    serviceDeemix: value.includes("DEEMIX"),
    serviceAllavsoft: value.includes("ALLAVSOFT"),
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    const value = args[i + 1];
    if (key.startsWith("--") && value && !value.startsWith("--")) {
      parsed[key.slice(2)] = value;
      i += 1;
    }
  }

  return parsed;
}

async function promptMissing(fields, parsed) {
  const rl = readline.createInterface({ input, output });
  const result = { ...parsed };

  for (const [key, label] of fields) {
    if (!result[key]) {
      result[key] = await rl.question(`${label}: `);
    }
  }

  rl.close();
  return result;
}

function deriveLegacyPlan(services) {
  const active = [
    services.servicePoolsVip && "VIP",
    services.serviceDeemix && "DEEMIX",
    services.serviceAllavsoft && "ALLAVSOFT",
  ].filter(Boolean);

  if (active.length === 1) return active[0];
  return "NONE";
}

async function main() {
  const parsed = parseArgs();
  const data = await promptMissing(
    [
      ["name", "Nome completo"],
      ["email", "E-mail"],
      ["password", "Senha (mín. 8 caracteres)"],
      ["whatsapp", "WhatsApp (com DDD)"],
      ["services", "Serviços (pools,deemix,allavsoft — separados por vírgula)"],
      ["monthlyValue", "Valor mensal (R$)"],
      ["dueDay", "Dia do vencimento (1-31)"],
      ["notes", "Observações (opcional)"],
    ],
    parsed,
  );

  const services = parseServices(data.services);
  const dueDay = Number(data.dueDay);
  const monthlyValue = Number(data.monthlyValue ?? 0);

  if (!services.servicePoolsVip && !services.serviceDeemix && !services.serviceAllavsoft) {
    console.error("Informe ao menos um serviço: pools, deemix ou allavsoft.");
    process.exit(1);
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    console.error("dueDay inválido. Use um número entre 1 e 31.");
    process.exit(1);
  }

  if (!Number.isFinite(monthlyValue) || monthlyValue < 0) {
    console.error("monthlyValue inválido.");
    process.exit(1);
  }

  if (String(data.password ?? "").length < 8) {
    console.error("A senha deve ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(String(data.password), 12);

  try {
    const user = await prisma.portalUser.create({
      data: {
        name: String(data.name).trim(),
        email: String(data.email).trim().toLowerCase(),
        passwordHash,
        whatsapp: String(data.whatsapp).trim(),
        plan: deriveLegacyPlan(services),
        ...services,
        monthlyValue,
        dueDay,
        nextDueAt: computeNextDueAt(dueDay),
        active: true,
        notes: data.notes ? String(data.notes).trim() : null,
      },
    });

    console.log("Usuário criado com sucesso!");
    console.log(`ID: ${user.id}`);
    console.log(`E-mail: ${user.email}`);
    console.log(`Pools VIP: ${user.servicePoolsVip ? "sim" : "não"}`);
    console.log(`Deemix: ${user.serviceDeemix ? "sim" : "não"}`);
    console.log(`Allavsoft: ${user.serviceAllavsoft ? "sim" : "não"}`);
    console.log(`Valor mensal: R$ ${Number(user.monthlyValue).toFixed(2)}`);
    console.log(`Próximo vencimento: ${user.nextDueAt.toISOString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unique constraint")) {
      console.error("Este e-mail já está cadastrado.");
    } else {
      console.error(message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
