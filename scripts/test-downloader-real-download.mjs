/**
 * Teste de download REAL via proxy do site (Google Drive).
 * Simula o que o Rust/Tauri faz: GET /api/musicas/download/{fileId} com Bearer.
 *
 * Uso: node scripts/test-downloader-real-download.mjs
 * Requer: npm run dev, usuário VIP, GOOGLE_DRIVE_API_KEY ou pasta pública.
 */
import { createHmac } from "node:crypto";
import { createWriteStream, readFileSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.DOWNLOADER_TEST_BASE_URL ?? "http://localhost:3000";
const DEVICE_ID = "real-download-test-device";

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
  return { status: response.status, json, headers: response.headers };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function listAudioInFolder(folderId, key) {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType)",
    pageSize: "100",
    key,
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.files ?? [];
}

async function findAudioRecursive(folderId, key, depth = 0) {
  if (depth > 4) return null;
  const files = await listAudioInFolder(folderId, key);
  const audio = files.find(
    (file) =>
      file.mimeType?.startsWith("audio/") || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file.name ?? ""),
  );
  if (audio) return audio;

  const folders = files.filter((file) => file.mimeType === "application/vnd.google-apps.folder");
  for (const folder of folders) {
    const nested = await findAudioRecursive(folder.id, key, depth + 1);
    if (nested) return nested;
  }
  return null;
}

async function findRealDriveTrack() {
  if (process.env.TEST_DRIVE_FILE_ID && process.env.TEST_DRIVE_FILE_NAME) {
    return {
      fileId: process.env.TEST_DRIVE_FILE_ID,
      fileName: process.env.TEST_DRIVE_FILE_NAME,
      relativePath: "Teste/Download Real",
    };
  }

  const key = process.env.GOOGLE_DRIVE_API_KEY ?? "";
  if (!key) throw new Error("GOOGLE_DRIVE_API_KEY necessária para localizar faixa real.");

  const folderUrl =
    process.env.GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID ??
    process.env.GOOGLE_DRIVE_PREVIEW_FOLDER_ID ??
    process.env.GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID ??
    "";
  const folderId = folderUrl.match(/[-\w]{25,}/)?.[0];
  if (!folderId) throw new Error("Configure GOOGLE_DRIVE_PREVIEW_FOLDER_ID ou GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID.");

  const file = await findAudioRecursive(folderId, key);
  if (!file?.id) throw new Error("Nenhuma faixa de áudio encontrada no Drive.");

  return {
    fileId: file.id,
    fileName: file.name,
    relativePath: "Teste/Download Real",
  };
}

async function findTrackFromSiteCatalog(token) {
  const root = await api(token, "/api/musicas/catalog");
  assert(root.status === 200, `catalog root: ${root.status}`);
  const month = root.json.items?.find((item) => item.kind === "folder") ?? root.json.items?.[0];
  assert(month?.id, "Nenhuma pasta no catálogo VIP.");

  const styleRes = await api(
    token,
    `/api/musicas/catalog?folderId=${encodeURIComponent(month.id)}&folderName=${encodeURIComponent(month.name)}`,
  );
  assert(styleRes.status === 200, `catalog style: ${styleRes.status}`);
  const style = styleRes.json.items?.find((item) => item.kind === "folder") ?? styleRes.json.items?.[0];
  assert(style?.id, "Nenhuma subpasta de estilo no catálogo.");

  const tracksRes = await api(
    token,
    `/api/musicas/tracks?folderId=${encodeURIComponent(style.id)}&folderName=${encodeURIComponent(style.name)}&limit=1`,
  );
  assert(tracksRes.status === 200, `tracks: ${tracksRes.status}`);
  const track = tracksRes.json.tracks?.[0];
  assert(track?.id, "Nenhuma faixa encontrada no catálogo VIP.");

  return {
    fileId: track.id,
    fileName: track.fileName ?? `${track.title}.mp3`,
    relativePath: `${month.name}/${style.name}`,
  };
}

async function resolveRealTrack(token) {
  try {
    return await findRealDriveTrack();
  } catch (driveError) {
    console.log(`Drive API: ${driveError.message} — usando catálogo do site…`);
    return findTrackFromSiteCatalog(token);
  }
}

async function downloadViaProxy(token, fileId, fileName, destPath) {
  const url = new URL(`${BASE_URL}/api/musicas/download/${fileId}`);
  url.searchParams.set("name", fileName);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "BrazilianPacksDownloaderTest/0.1",
    },
  });

  assert(response.ok, `Proxy download falhou: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  assert(
    !contentType.includes("text/html") && !contentType.includes("application/json"),
    `Resposta inválida do Drive (${contentType})`,
  );

  const expectedLength = Number(response.headers.get("content-length") ?? 0);
  await pipeline(response.body, createWriteStream(destPath));

  const stats = statSync(destPath);
  assert(stats.size > 10_000, `Arquivo muito pequeno (${stats.size} bytes) — possível erro`);
  if (expectedLength > 0) {
    assert(stats.size === expectedLength, `Tamanho divergente: disco=${stats.size}, header=${expectedLength}`);
  }

  return { bytes: stats.size, contentType, expectedLength };
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: resolve(process.cwd(), ".env.local") });
    dotenv.config({ path: resolve(process.cwd(), ".env") });
  } catch {
    /* dotenv opcional */
  }

  const prisma = new PrismaClient();
  const user = await prisma.portalUser.findFirst({
    where: { active: true, plan: "VIP" },
    orderBy: { id: "asc" },
  });
  if (!user) throw new Error("Nenhum usuário VIP ativo.");

  const token = createPortalToken(user.id);
  const track = await resolveRealTrack(token);
  console.log(`Faixa real: ${track.fileName} (${track.fileId})`);

  await api(token, "/api/downloader/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      deviceName: "PC Teste Download",
      platform: "windows",
      appVersion: "0.1.0",
    }),
  });

  const createRes = await api(token, "/api/downloader/jobs", {
    method: "POST",
    body: JSON.stringify({
      fileId: track.fileId,
      fileName: track.fileName,
      relativePath: track.relativePath,
      provider: "google_drive",
    }),
  });
  assert(createRes.status === 201, `create job: ${createRes.status}`);
  const jobId = createRes.json.job.id;

  await api(token, `/api/downloader/jobs/${jobId}/claim`, {
    method: "POST",
    body: JSON.stringify({ deviceId: DEVICE_ID }),
  });

  await api(token, `/api/downloader/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      status: "DOWNLOADING",
      progress: 0,
      downloadedBytes: "0",
    }),
  });

  const destPath = join(tmpdir(), `bp-real-download-${Date.now()}.mp3`);
  try {
    const result = await downloadViaProxy(token, track.fileId, track.fileName, destPath);
    console.log(`✓ Arquivo baixado: ${destPath}`);
    console.log(`✓ Tamanho: ${(result.bytes / (1024 * 1024)).toFixed(2)} MB (${result.bytes} bytes)`);
    console.log(`✓ Content-Type: ${result.contentType}`);

    await api(token, `/api/downloader/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        status: "COMPLETED",
        progress: 100,
        downloadedBytes: String(result.bytes),
        totalBytes: result.expectedLength > 0 ? String(result.expectedLength) : String(result.bytes),
      }),
    });
    console.log("✓ Job marcado COMPLETED no banco");
  } finally {
    try {
      unlinkSync(destPath);
    } catch {
      /* ignore */
    }
    await prisma.$disconnect();
  }

  console.log("\nDownload real via proxy Google Drive validado.");
  if (!process.env.GOOGLE_DRIVE_API_KEY) {
    console.log("\nLimitação: sem GOOGLE_DRIVE_API_KEY — proxy usa URL pública usercontent (pode ser instável).");
  }
}

main().catch((error) => {
  console.error("\nFalha:", error.message ?? error);
  process.exit(1);
});
