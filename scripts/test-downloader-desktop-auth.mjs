/**
 * Testes do fluxo de autenticação desktop (API).
 * Uso: node scripts/test-downloader-desktop-auth.mjs
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";
const DESKTOP_HEADERS = {
  "Content-Type": "application/json",
  "X-BP-Client": "downloader",
};

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

function signToken(userId, exp) {
  const secret = process.env.PORTAL_SESSION_SECRET ?? "altere-este-segredo-no-env-local";
  const payloadB64 = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

function createValidToken(userId) {
  return signToken(userId, Date.now() + 60 * 60 * 1000);
}

function createExpiredToken(userId) {
  return signToken(userId, Date.now() - 1000);
}

async function desktopLogin(email, password) {
  const response = await fetch(`${BASE_URL}/api/portal/login`, {
    method: "POST",
    headers: DESKTOP_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function getSession(token) {
  const response = await fetch(`${BASE_URL}/api/musicas/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function registerDevice(token, deviceId) {
  const response = await fetch(`${BASE_URL}/api/downloader/devices`, {
    method: "POST",
    headers: {
      ...DESKTOP_HEADERS,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceId,
      deviceName: "PC TESTE AUTH",
      platform: "windows",
      appVersion: "0.1.0",
    }),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const prisma = new PrismaClient();
  const user = await prisma.portalUser.findFirst({
    where: { active: true, servicePoolsVip: true },
    orderBy: { id: "asc" },
  });
  assert(user, "Nenhum usuário VIP ativo para testes.");

  console.log("1) Login inválido");
  const badLogin = await desktopLogin(user.email, "senha-invalida-teste");
  assert(badLogin.status === 401, `esperado 401, recebeu ${badLogin.status}`);
  console.log("   ✓ 401 para credenciais inválidas");

  console.log("2) Login válido (desktop client)");
  const token = createValidToken(user.id);
  const desktopTokenProbe = await getSession(token);
  assert(desktopTokenProbe.json.authenticated, "Bearer token deve autenticar");
  console.log("   ✓ Bearer auth funcionando");

  console.log("3) Sessão via Bearer");
  const session = await getSession(token);
  assert(session.status === 200 && session.json.authenticated, "sessão deve autenticar");
  assert(session.json.hasVip, "usuário deve ser VIP");
  console.log("   ✓ sessão válida");

  console.log("4) Registro de dispositivo");
  const deviceId = `auth-test-${Date.now()}`;
  const device = await registerDevice(token, deviceId);
  assert(device.status === 201, `registro: ${device.status}`);
  assert(device.json.device?.deviceId === deviceId, "deviceId persistido");
  console.log("   ✓ dispositivo registrado");

  console.log("5) Sessão expirada");
  const expired = await getSession(createExpiredToken(user.id));
  assert(expired.json.authenticated === false, "token expirado não deve autenticar");
  console.log("   ✓ token expirado rejeitado");

  console.log("6) Logout lógico (token descartado)");
  const afterLogout = await getSession("token-invalido-descartado");
  assert(afterLogout.json.authenticated === false, "sem token não autentica");
  console.log("   ✓ sem token = desconectado");

  console.log("7) Reabrir app (token persistido)");
  const reopen = await getSession(token);
  assert(reopen.json.authenticated === true, "token salvo deve continuar válido");
  console.log("   ✓ token ainda válido após simular reabertura");

  await prisma.$disconnect();
  console.log("\nTestes de autenticação desktop concluídos.");
}

main().catch(async (error) => {
  console.error("\nFalha:", error.message ?? error);
  process.exit(1);
});
