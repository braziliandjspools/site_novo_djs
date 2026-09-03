/**
 * Testes manuais das APIs do downloader.
 * Uso: node scripts/test-downloader-api.mjs
 * Requer: DATABASE_URL no .env, tabelas aplicadas, usuário VIP ativo no banco.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";
const DEVICE_ID = "test-device-00000001";

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
    /* arquivo opcional */
  }
}

function loadEnv() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

function createPortalToken(userId) {
  const secret = process.env.PORTAL_SESSION_SECRET ?? "altere-este-segredo-no-env-local";
  const payload = {
    userId,
    exp: Date.now() + 60 * 60 * 1000,
  };
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnv();
  const prisma = new PrismaClient();

  const user = await prisma.portalUser.findFirst({
    where: { active: true, servicePoolsVip: true },
    orderBy: { id: "asc" },
  });

  if (!user) {
    throw new Error("Nenhum usuário VIP ativo encontrado para testes.");
  }

  const cookie = createPortalToken(user.id);
  console.log(`Testando com usuário #${user.id} (${user.email})`);

  let res = await api(cookie, "/api/downloader/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      deviceName: "PC Teste",
      platform: "windows",
      appVersion: "0.0.1",
    }),
  });
  assert(res.status === 201, `register device: ${res.status} ${JSON.stringify(res.json)}`);
  console.log("✓ POST /api/downloader/devices");

  res = await api(cookie, "/api/downloader/devices");
  assert(res.status === 200 && Array.isArray(res.json.devices), "list devices");
  console.log("✓ GET /api/downloader/devices");

  res = await api(cookie, "/api/downloader/devices/heartbeat", {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });
  assert(res.status === 200, `heartbeat: ${res.status}`);
  console.log("✓ POST /api/downloader/devices/heartbeat");

  res = await api(cookie, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({
      fileId: "abc123DriveFileId",
      fileName: "Artist - Title (Clean).mp3",
      relativePath: "Fevereiro/Funk",
      fileSize: "5242880",
      mimeType: "audio/mpeg",
    }),
  });
  assert(res.status === 201, `create job: ${res.status} ${JSON.stringify(res.json)}`);
  const jobId = res.json.job.id;
  console.log("✓ POST /api/downloader/jobs");

  res = await api(cookie, "/api/downloader/jobs/batch", {
    method: "POST",
    body: JSON.stringify({
      jobs: [
        { fileId: "batchFile001", fileName: "Batch One.mp3" },
        { fileId: "batchFile002", fileName: "Batch Two.mp3" },
      ],
    }),
  });
  assert(res.status === 201 && res.json.count === 2, `batch: ${res.status}`);
  console.log("✓ POST /api/downloader/jobs/batch");

  res = await api(cookie, "/api/downloader/jobs?status=pending&limit=10");
  assert(res.status === 200 && Array.isArray(res.json.jobs), "list jobs");
  console.log("✓ GET /api/downloader/jobs");

  res = await api(cookie, `/api/downloader/jobs/${jobId}/claim`, {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });
  assert(res.status === 200 && res.json.job.status === "RECEIVED", `claim: ${res.status}`);
  console.log("✓ POST /api/downloader/jobs/[id]/claim");

  res = await api(cookie, `/api/downloader/jobs/${jobId}/claim`, {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });
  assert(res.status === 409, `claim duplicado deve conflitar: ${res.status}`);
  console.log("✓ claim duplicado retorna 409");

  res = await api(cookie, `/api/downloader/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      status: "downloading",
      progress: 40,
      downloadedBytes: "2097152",
      totalBytes: "5242880",
    }),
  });
  assert(res.status === 200 && res.json.job.status === "DOWNLOADING", `patch: ${res.status}`);
  console.log("✓ PATCH /api/downloader/jobs/[id]");

  const failJobRes = await api(cookie, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({ fileId: "failJobFile01", fileName: "Fail Me.mp3" }),
  });
  const failJobId = failJobRes.json.job.id;

  await api(cookie, `/api/downloader/jobs/${failJobId}/claim`, {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });

  await api(cookie, `/api/downloader/jobs/${failJobId}`, {
    method: "PATCH",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      status: "failed",
      error: "Erro simulado",
    }),
  });

  res = await api(cookie, `/api/downloader/jobs/${failJobId}/retry`, { method: "POST" });
  assert(res.status === 200 && res.json.job.status === "PENDING", `retry: ${res.status}`);
  console.log("✓ POST /api/downloader/jobs/[id]/retry");

  const cancelJobRes = await api(cookie, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({ fileId: "cancelJobFile", fileName: "Cancel Me.mp3" }),
  });
  const cancelJobId = cancelJobRes.json.job.id;

  res = await api(cookie, `/api/downloader/jobs/${cancelJobId}/cancel`, { method: "POST" });
  assert(res.status === 200 && res.json.job.status === "CANCELLED", `cancel: ${res.status}`);
  console.log("✓ POST /api/downloader/jobs/[id]/cancel");

  res = await api(cookie, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({ fileId: "invalid id!", fileName: "Bad.mp3" }),
  });
  assert(res.status === 400, "fileId inválido deve retornar 400");
  console.log("✓ validação de fileId inválido");

  await prisma.$disconnect();
  console.log("\nTodos os testes do downloader passaram.");
}

main().catch(async (error) => {
  console.error("\nFalha nos testes:", error.message ?? error);
  process.exit(1);
});
