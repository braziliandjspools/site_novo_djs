/**
 * Enfileira 10 jobs de teste para validar concorrência e fila do downloader.
 * Uso: node scripts/test-downloader-batch-queue.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";
const DEVICE_ID = "batch-test-device-001";
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 10);

function loadEnvFile(fileName) {
  try {
    const envPath = resolve(process.cwd(), fileName);
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    /* opcional */
  }
}

function createPortalToken(userId) {
  const secret = process.env.PORTAL_SESSION_SECRET ?? "altere-este-segredo-no-env-local";
  const payload = { userId, exp: Date.now() + 60 * 60 * 1000 };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

async function api(cookie, path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: `bp_portal_session=${cookie}`,
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const prisma = new PrismaClient();
  const user = await prisma.portalUser.findFirst({
    where: { active: true, servicePoolsVip: true },
    orderBy: { id: "asc" },
  });
  if (!user) throw new Error("Nenhum usuário VIP ativo encontrado.");

  const cookie = createPortalToken(user.id);
  console.log(`Enfileirando ${BATCH_SIZE} jobs para usuário #${user.id}`);

  await api(cookie, "/api/downloader/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      deviceName: "Batch Test PC",
      platform: "windows",
      appVersion: "0.1.0",
    }),
  });

  const jobs = Array.from({ length: BATCH_SIZE }, (_, index) => ({
    fileId: process.env.TEST_DRIVE_FILE_ID ?? `test-file-${index + 1}`,
    fileName: `Batch Track ${String(index + 1).padStart(2, "0")}.mp3`,
    relativePath: `batch-test/${String(index + 1).padStart(2, "0")}.mp3`,
    fileSize: "3145728",
  }));

  const res = await api(cookie, "/api/downloader/jobs/batch", {
    method: "POST",
    body: JSON.stringify({ jobs }),
  });

  if (res.status !== 201) {
    throw new Error(`batch create failed: ${res.status} ${JSON.stringify(res.json)}`);
  }

  const created = res.json.jobs ?? [];
  console.log(`✓ ${created.length} jobs criados:`);
  for (const job of created) {
    console.log(`  - #${job.id} ${job.fileName} (${job.status})`);
  }

  console.log("\nAbra o app desktop e observe até 3 downloads simultâneos (padrão).");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
