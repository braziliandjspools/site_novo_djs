#!/usr/bin/env node
/**
 * Simula o fluxo de login do Downloader contra a API.
 * Uso: node scripts/test-downloader-login.mjs [baseUrl] [email] [password]
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const email = process.argv[3] ?? "";
const password = process.argv[4] ?? "";

async function main() {
  console.log("Base:", base);

  const ping = await fetch(`${base}/api/musicas/session`);
  console.log("Session ping:", ping.status);

  if (!email || !password) {
    console.log("Passe email e senha: node scripts/test-downloader-login.mjs <url> <email> <senha>");
    return;
  }

  const loginRes = await fetch(`${base}/api/portal/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BP-Client": "downloader",
    },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  console.log("Login status:", loginRes.status);
  console.log("Login body keys:", Object.keys(loginBody));
  console.log("Has token:", Boolean(loginBody.token));

  if (!loginBody.token) {
    console.log("Login error:", loginBody.error ?? loginBody);
    return;
  }

  const sessionRes = await fetch(`${base}/api/musicas/session`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  });
  const sessionBody = await sessionRes.json().catch(() => ({}));
  console.log("Session status:", sessionRes.status);
  console.log("Session:", sessionBody);

  const deviceRes = await fetch(`${base}/api/downloader/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginBody.token}`,
      "X-BP-Client": "downloader",
    },
    body: JSON.stringify({
      deviceId: "bp-test-device",
      deviceName: "Test PC",
      platform: "windows",
      appVersion: "0.1.0",
    }),
  });
  const deviceBody = await deviceRes.json().catch(() => ({}));
  console.log("Device register status:", deviceRes.status);
  console.log("Device register:", deviceBody);
}

main().catch(console.error);
