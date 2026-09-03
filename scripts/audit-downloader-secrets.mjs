#!/usr/bin/env node

/**
 * Audita artefatos do Downloader em busca de secrets acidentalmente embutidos.
 * Falha (exit 1) se encontrar padrões sensíveis.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOWNLOADER = join(ROOT, "apps/downloader");

const SCAN_DIRS = [
  join(DOWNLOADER, "dist"),
  join(DOWNLOADER, "src-tauri/target/release"),
  join(DOWNLOADER, "release"),
].filter(existsSync);

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".css",
  ".html",
  ".json",
  ".map",
  ".txt",
  ".rs",
  ".toml",
  ".xml",
  ".wxs",
  ".nsh",
]);

const PATTERNS = [
  { name: "DATABASE_URL", regex: /DATABASE_URL\s*[=:]\s*['"]?postgres/i },
  { name: "Neon host", regex: /neon\.tech/i },
  { name: "JWT secret", regex: /JWT_SECRET|PORTAL_SESSION_SECRET/i },
  { name: "Admin secret", regex: /PORTAL_ADMIN_SECRET/i },
  { name: "Service role", regex: /SERVICE_ROLE|service_role/i },
  { name: "Google client secret", regex: /GOOGLE_CLIENT_SECRET|GOCSPX-/i },
  { name: "OpenRouter key", regex: /OPENROUTER_API_KEY|sk-or-v1-/i },
  { name: "Private key PEM", regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "AWS secret", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Hardcoded password hash", regex: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/ },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function isTextFile(path) {
  const ext = extname(path).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (path.endsWith(".exe") || path.endsWith(".dll")) return false;
  return false;
}

function scanFile(path) {
  const hits = [];
  let content;
  try {
    if (path.endsWith(".exe") || path.endsWith(".dll")) {
      content = readFileSync(path).toString("latin1");
    } else if (!isTextFile(path)) {
      return hits;
    } else {
      content = readFileSync(path, "utf8");
    }
  } catch {
    return hits;
  }

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(content)) {
      hits.push(pattern.name);
    }
  }
  return hits;
}

function main() {
  if (SCAN_DIRS.length === 0) {
    console.log("[audit] Nenhum artefato de build encontrado — pulando (execute após o build).");
    process.exit(0);
  }

  const findings = [];
  for (const dir of SCAN_DIRS) {
    const files = walk(dir);
    for (const file of files) {
      const hits = scanFile(file);
      if (hits.length) {
        findings.push({ file, hits: [...new Set(hits)] });
      }
    }
  }

  if (findings.length === 0) {
    console.log("[audit] OK — nenhum secret detectado nos artefatos.");
    process.exit(0);
  }

  console.error("[audit] FALHA — possíveis secrets encontrados:\n");
  for (const item of findings) {
    console.error(`  ${item.file}`);
    console.error(`    → ${item.hits.join(", ")}\n`);
  }
  process.exit(1);
}

main();
