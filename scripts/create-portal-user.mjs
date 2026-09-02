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

async function main() {
  const parsed = parseArgs();
  const data = await promptMissing(
    [
      ["name", "Nome completo"],
      ["email", "E-mail"],
      ["password", "Senha (mín. 8 caracteres)"],
      ["whatsapp", "WhatsApp (com DDD)"],
      ["plan", "Plano (VIP, DEEMIX ou ALLAVSOFT)"],
      ["dueDay", "Dia do vencimento (1-31)"],
      ["notes", "Observações (opcional)"],
    ],
    parsed,
  );

  const plan = String(data.plan ?? "").trim().toUpperCase();
  const dueDay = Number(data.dueDay);

  if (!["VIP", "DEEMIX", "ALLAVSOFT"].includes(plan)) {
    console.error("Plano inválido. Use VIP, DEEMIX ou ALLAVSOFT.");
    process.exit(1);
  }

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    console.error("dueDay inválido. Use um número entre 1 e 31.");
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
        plan,
        dueDay,
        nextDueAt: computeNextDueAt(dueDay),
        active: true,
        notes: data.notes ? String(data.notes).trim() : null,
      },
    });

    console.log("Usuário criado com sucesso!");
    console.log(`ID: ${user.id}`);
    console.log(`E-mail: ${user.email}`);
    console.log(`Plano: ${user.plan}`);
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
