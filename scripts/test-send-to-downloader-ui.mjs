/**
 * Testes da integração site → API do Downloader.
 * Uso: node scripts/test-send-to-downloader-ui.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";

function loadEnvFile(fileName) {
  try {
    const content = readFileSync(resolve(process.cwd(), fileName), "utf8");
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
    /* optional */
  }
}

function createPortalToken(userId) {
  const secret = process.env.PORTAL_SESSION_SECRET ?? "altere-este-segredo-no-env-local";
  const payloadB64 = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 60 * 60 * 1000 }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function postJob(cookie, body) {
  const response = await fetch(`${BASE_URL}/api/downloader/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `bp_portal_session=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function postBatch(cookie, jobs) {
  const response = await fetch(`${BASE_URL}/api/downloader/jobs/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `bp_portal_session=${cookie}` } : {}),
    },
    body: JSON.stringify({ jobs }),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const prisma = new PrismaClient();
  const user = await prisma.portalUser.findFirst({
    where: { active: true, plan: "VIP" },
    orderBy: { id: "asc" },
  });
  assert(user, "Nenhum usuário VIP ativo para testes.");
  const cookie = createPortalToken(user.id);

  console.log("1) Uma música (payload do site)");
  const single = await postJob(cookie, {
    fileId: "uiTestSingleFile01",
    fileName: "Artist - Track.mp3",
    relativePath: "Agosto 2026/Funk",
    provider: "google_drive",
  });
  assert(single.status === 201, `single: ${single.status} ${JSON.stringify(single.json)}`);
  assert(single.json.job?.fileId === "uiTestSingleFile01", "fileId persistido");
  assert(single.json.job?.provider === "GOOGLE_DRIVE", "provider normalizado");
  console.log("   ✓ job criado");

  console.log("2) Várias músicas (batch)");
  const batch = await postBatch(cookie, [
    {
      fileId: "uiTestBatchFile01",
      fileName: "Batch One.mp3",
      relativePath: "Agosto 2026/Sertanejo",
      provider: "google_drive",
    },
    {
      fileId: "uiTestBatchFile02",
      fileName: "Batch Two.mp3",
      relativePath: "Agosto 2026/Sertanejo",
      provider: "google_drive",
    },
  ]);
  assert(batch.status === 201 && batch.json.count === 2, `batch: ${batch.status}`);
  console.log("   ✓ batch criado");

  console.log("3) Usuário não autenticado");
  const unauth = await postJob(null, {
    fileId: "uiTestUnauthFile",
    fileName: "No Auth.mp3",
    provider: "google_drive",
  });
  assert(unauth.status === 401, `unauth deve ser 401, recebeu ${unauth.status}`);
  console.log("   ✓ 401 sem sessão");

  console.log("4) Erro da API (fileId inválido)");
  const invalid = await postJob(cookie, {
    fileId: "invalid id with spaces!",
    fileName: "Bad.mp3",
    provider: "google_drive",
  });
  assert(invalid.status === 400, `invalid deve ser 400, recebeu ${invalid.status}`);
  console.log("   ✓ 400 para fileId inválido");

  await prisma.$disconnect();
  console.log("\nTodos os testes de integração passaram.");
}

main().catch(async (error) => {
  console.error("\nFalha:", error.message ?? error);
  process.exit(1);
});
