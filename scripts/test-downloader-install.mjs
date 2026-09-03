#!/usr/bin/env node

/**
 * Testa instalação silenciosa do instalador NSIS em pasta isolada.
 *
 * IMPORTANTE: este script NÃO usa o caminho padrão de produção.
 * Ele força `/D=...` numa pasta de teste para não alterar a instalação real.
 *
 * Instalação real (perMachine): C:\Program Files\Brazilian Packs Downloader
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INSTALLER = join(ROOT, "apps/downloader/release/BrazilianPacksDownloader_Setup.exe");
const PRODUCTION_DIR = "C:\\Program Files\\Brazilian Packs Downloader";

function main() {
  if (!existsSync(INSTALLER)) {
    console.error(`Instalador não encontrado: ${INSTALLER}`);
    console.error("Execute: npm run downloader:release");
    process.exit(1);
  }

  const installDir = mkdtempSync(join(tmpdir(), "bp-downloader-test-"));
  console.log("=== Teste de instalação (pasta isolada) ===");
  console.log(`Pasta de teste: ${installDir}`);
  console.log(`Instalação real do usuário: ${PRODUCTION_DIR}`);
  console.log("(O teste usa Temp de propósito — não sobrescreve Program Files.)\n");

  const result = spawnSync(INSTALLER, ["/S", `/D=${installDir}`], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    console.error(`Instalação falhou (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }

  const entries = readdirSync(installDir, { recursive: true });
  const exe = entries.find((entry) => String(entry).endsWith(".exe"));
  if (!exe) {
    console.error("Executável não encontrado após instalação.");
    process.exit(1);
  }

  console.log("\nOK — instalador funciona.");
  console.log(`Executável de teste: ${join(installDir, String(exe))}`);

  try {
    rmSync(installDir, { recursive: true, force: true });
    console.log("Pasta de teste removida.");
  } catch {
    console.warn(`Remova manualmente: ${installDir}`);
  }
}

main();
