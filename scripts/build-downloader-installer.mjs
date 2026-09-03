#!/usr/bin/env node

/**
 * Build de produção do Brazilian Packs Downloader + instalador NSIS Windows.
 * Copia o setup para apps/downloader/release/BrazilianPacksDownloader_Setup.exe
 */

import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOWNLOADER = join(ROOT, "apps/downloader");
const RELEASE_DIR = join(DOWNLOADER, "release");
const TARGET_DIR = join(DOWNLOADER, "src-tauri/target");
const TARGET_NSIS = join(TARGET_DIR, "release/bundle/nsis");
const OUTPUT_NAME = "BrazilianPacksDownloader_Setup.exe";

const PRODUCTION_SITE = (process.env.VITE_PRODUCTION_SITE_URL ?? "https://sitenovodjs.vercel.app").replace(/\/+$/, "");

const PRODUCTION_ENV = {
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? PRODUCTION_SITE,
  VITE_BP_SITE_URL: process.env.VITE_BP_SITE_URL ?? `${PRODUCTION_SITE}/musicas/atualizacoes`,
  VITE_APP_VERSION: readVersion(),
  VITE_UPDATER_ENABLED: "false",
};

function readVersion() {
  const conf = JSON.parse(readFileSync(join(DOWNLOADER, "src-tauri/tauri.conf.json"), "utf8"));
  return conf.version ?? "0.1.0";
}

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, {
    cwd: options.cwd ?? DOWNLOADER,
    stdio: "inherit",
    env: { ...process.env, ...PRODUCTION_ENV, ...(options.env ?? {}) },
    shell: true,
  });
}

function findNsisInstaller() {
  const searchRoots = [
    TARGET_NSIS,
    join(DOWNLOADER, "src-tauri/target/release/bundle/nsis"),
    join(DOWNLOADER, "src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"),
  ].filter(existsSync);

  for (const dir of searchRoots) {
    const candidates = readdirSync(dir).filter((name) => name.endsWith("-setup.exe"));
    if (candidates.length > 0) {
      candidates.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
      return join(dir, candidates[0]);
    }
  }

  throw new Error(
    `Instalador NSIS não encontrado. Pastas verificadas:\n${searchRoots.map((p) => `  - ${p}`).join("\n")}`,
  );
}

function writeBuildInfo(outputPath, sourcePath, version) {
  const size = statSync(outputPath).size;
  const info = {
    productName: "Brazilian Packs Downloader",
    version,
    installer: OUTPUT_NAME,
    sourceInstaller: sourcePath.replace(/\\/g, "/"),
    outputPath: outputPath.replace(/\\/g, "/"),
    sizeBytes: size,
    sizeHuman: `${(size / (1024 * 1024)).toFixed(2)} MB`,
    builtAt: new Date().toISOString(),
    apiBaseUrl: PRODUCTION_ENV.VITE_API_BASE_URL,
  };
  writeFileSync(join(RELEASE_DIR, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`, "utf8");
  return info;
}

function main() {
  console.log("=== Brazilian Packs Downloader — release build ===");
  console.log(`Versão: ${PRODUCTION_ENV.VITE_APP_VERSION}`);
  console.log(`API: ${PRODUCTION_ENV.VITE_API_BASE_URL}`);

  run("npm run tauri build -- --bundles nsis", {
    env: { CARGO_TARGET_DIR: TARGET_DIR },
  });

  const source = findNsisInstaller();
  mkdirSync(RELEASE_DIR, { recursive: true });
  const output = join(RELEASE_DIR, OUTPUT_NAME);
  copyFileSync(source, output);

  const info = writeBuildInfo(output, source, PRODUCTION_ENV.VITE_APP_VERSION);

  console.log("\n=== Build concluído ===");
  console.log(`Instalador: ${output}`);
  console.log(`Tamanho: ${info.sizeHuman}`);
  console.log(`Versão: ${info.version}`);

  run(`node "${join(ROOT, "scripts/audit-downloader-secrets.mjs")}"`, { cwd: ROOT });
}

main();
