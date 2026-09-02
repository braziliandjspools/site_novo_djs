/**
 * Teste do fluxo SITE → BANCO → APP (polling + claim, sem download Drive).
 * Uso: node scripts/test-downloader-queue-sync.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";
const DEVICE_ID = "queue-sync-test-device";

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const prisma = new PrismaClient();
  const user = await prisma.portalUser.findFirst({
    where: { active: true, plan: "VIP" },
    orderBy: { id: "asc" },
  });
  if (!user) throw new Error("Nenhum usuário VIP ativo encontrado.");

  const token = createPortalToken(user.id);
  console.log(`Fluxo SITE → BANCO → APP com usuário #${user.id}`);

  // App conectado: registra dispositivo
  let res = await api(token, "/api/downloader/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      deviceName: "PC Teste Fila",
      platform: "windows",
      appVersion: "0.1.0",
    }),
  });
  assert(res.status === 201 || res.status === 200, `register device: ${res.status}`);
  console.log("✓ App registrou dispositivo");

  // Site envia música para o downloader (simula POST do site)
  const fileName = `Teste Fila ${Date.now()}.mp3`;
  res = await api(token, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({
      fileId: "queueSyncFile001",
      fileName,
      relativePath: "Março/Sertanejo",
    }),
  });
  assert(res.status === 201, `create job: ${res.status}`);
  const jobId = res.json.job.id;
  console.log(`✓ Site criou job #${jobId} no banco (${fileName})`);

  // App faz polling (simula DownloadManager)
  let found = null;
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    res = await api(token, "/api/downloader/jobs?limit=100");
    assert(res.status === 200, "list jobs");
    found = res.json.jobs.find((job) => job.id === jobId);
    if (found?.status === "PENDING") break;
    await sleep(500);
  }
  assert(found?.status === "PENDING", "Job PENDING não encontrado no polling");
  console.log(`✓ App encontrou job PENDING em ${Date.now() - started}ms`);

  // App faz claim
  res = await api(token, `/api/downloader/jobs/${jobId}/claim`, {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });
  assert(res.status === 200 && res.json.job.status === "RECEIVED", `claim: ${res.status}`);
  console.log("✓ App fez claim → status RECEIVED (na fila local, aguardando download)");

  // Heartbeat
  res = await api(token, "/api/downloader/devices/heartbeat", {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });
  assert(res.status === 200, "heartbeat");
  console.log("✓ Heartbeat do dispositivo OK");

  // Confirma fila visível no app
  res = await api(token, `/api/downloader/jobs?deviceId=${DEVICE_ID}&limit=100`);
  const inQueue = res.json.jobs.some(
    (job) => job.id === jobId && job.status === "RECEIVED" && job.fileName === fileName,
  );
  assert(inQueue, "Job não aparece na fila do dispositivo");
  console.log("✓ Job visível na fila do app com nome da música");

  await prisma.$disconnect();
  console.log("\nFluxo SITE → BANCO → APP validado com sucesso.");
}

main().catch(async (error) => {
  console.error("\nFalha:", error.message ?? error);
  process.exit(1);
});
