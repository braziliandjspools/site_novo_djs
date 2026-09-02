/**
 * Testes de pasta de downloads e segurança de paths (via cargo test no Rust).
 * Uso: npm run downloader:test:paths
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const tauriDir = resolve("apps/downloader/src-tauri");
const result = spawnSync("cargo", ["test", "-p", "brazilian-packs-downloader", "paths::"], {
  cwd: tauriDir,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("\n✓ Testes de path/pasta OK");
