import { execSync } from "node:child_process";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

function run(command, env = process.env) {
  execSync(command, { stdio: "inherit", env });
}

function tryRun(command, env = process.env) {
  try {
    run(command, env);
    return true;
  } catch {
    return false;
  }
}

function cleanPrismaEngineTemps() {
  const clientDir = join(process.cwd(), "node_modules", ".prisma", "client");
  if (!existsSync(clientDir)) return;
  for (const name of readdirSync(clientDir)) {
    if (name.includes(".tmp") || name.endsWith(".tmp")) {
      try {
        unlinkSync(join(clientDir, name));
      } catch {
        /* ignore */
      }
    }
  }
}

run("npx prisma generate");
cleanPrismaEngineTemps();

const databaseUrl = process.env.DATABASE_URL?.trim();
const directUrl = process.env.DIRECT_URL?.trim() || databaseUrl;
const skipDbSetup =
  process.env.SKIP_DB_SETUP === "1" ||
  process.env.SKIP_DB_SETUP === "true" ||
  process.env.DOKPLOY_SKIP_DB_BUILD === "1";

if (!databaseUrl) {
  console.warn("[build] DATABASE_URL não definida — pulando setup do banco.");
} else if (skipDbSetup) {
  console.warn(
    "[build] SKIP_DB_SETUP ativo — pulando db push/migrate (schema já aplicado no runtime).",
  );
} else {
  const migrationEnv = { ...process.env, DATABASE_URL: directUrl };

  // db push primeiro: evita P3005 quando o banco já tem tabelas sem histórico de migration
  // --accept-data-loss: drops intencionais (ex.: due_day / notes) no schema portal
  const pushed = tryRun("npx prisma db push --skip-generate --accept-data-loss", migrationEnv);
  if (!pushed) {
    console.warn("[build] db push falhou — tentando migrate deploy...");
    if (!tryRun("npx prisma migrate deploy", migrationEnv)) {
      // Build Docker/Nixpacks muitas vezes não alcança host interno do Dokploy
      // (ex.: plataforma-*-stfihn). O schema já pode estar aplicado via restore/migrate.
      console.warn(
        "[build] Banco inacessível no build — seguindo com next build. " +
          "Garanta que o schema já está aplicado e que o app alcança o DB em runtime.",
      );
    }
  }
}

run("npx next build");
