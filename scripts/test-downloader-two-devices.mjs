/**
 * Testa roteamento de jobs entre dois dispositivos simulados.
 * Uso: node scripts/test-downloader-two-devices.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";
const DEVICE_A = "two-device-test-a";
const DEVICE_B = "two-device-test-b";

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

async function api(token, path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-BP-Client": "downloader",
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function registerDevice(token, deviceId, deviceName) {
  return api(token, "/api/downloader/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceId,
      deviceName,
      platform: "windows",
      appVersion: "0.1.0-test",
    }),
  });
}

async function createJob(token, fileId, targetDeviceId) {
  return api(token, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({
      fileId,
      fileName: `${fileId}.mp3`,
      provider: "google_drive",
      targetDeviceId,
    }),
  });
}

async function claimJob(token, jobId, deviceId) {
  return api(token, `/api/downloader/jobs/${jobId}/claim`, {
    method: "POST",
    body: JSON.stringify({ deviceId }),
  });
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

  const token = createPortalToken(user.id);
  console.log(`Teste two-device para usuário #${user.id}`);

  await registerDevice(token, DEVICE_A, "PC Studio");
  await registerDevice(token, DEVICE_B, "Notebook");

  const sharedFileId = `two-device-file-${Date.now()}`;
  const targetedA = await createJob(token, `${sharedFileId}-a`, DEVICE_A);
  assert(targetedA.status === 201, "Falha ao criar job para device A");

  const targetedB = await createJob(token, `${sharedFileId}-b`, DEVICE_B);
  assert(targetedB.status === 201, "Falha ao criar job para device B");

  const openJob = await createJob(token, `${sharedFileId}-open`, null);
  assert(openJob.status === 201, "Falha ao criar job aberto");
  const openJobId = openJob.json.job.id;

  const claimAOnA = await claimJob(token, targetedA.json.job.id, DEVICE_A);
  assert(claimAOnA.status === 200, "Device A deveria claim job destinado a A");

  const claimBOnA = await claimJob(token, targetedB.json.job.id, DEVICE_A);
  assert(claimBOnA.status === 409, "Device A não deveria claim job destinado a B");

  const claimBOnB = await claimJob(token, targetedB.json.job.id, DEVICE_B);
  assert(claimBOnB.status === 200, "Device B deveria claim job destinado a B");

  const firstOpenClaim = await claimJob(token, openJobId, DEVICE_A);
  assert(firstOpenClaim.status === 200, "Primeiro claim do job aberto deveria funcionar");

  const secondOpenClaim = await claimJob(token, openJobId, DEVICE_B);
  assert(secondOpenClaim.status === 409, "Segundo claim do mesmo job deveria conflitar");

  console.log("OK: roteamento por device e anti-duplicação validados.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
