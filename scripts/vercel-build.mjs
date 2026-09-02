import { execSync } from "node:child_process";

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

run("npx prisma generate");

const databaseUrl = process.env.DATABASE_URL?.trim();
const directUrl = process.env.DIRECT_URL?.trim() || databaseUrl;

if (!databaseUrl) {
  console.warn("[build] DATABASE_URL não definida — pulando setup do banco.");
} else {
  const migrationEnv = { ...process.env, DATABASE_URL: directUrl };

  // db push primeiro: evita P3005 quando o banco já tem tabelas sem histórico de migration
  const pushed = tryRun("npx prisma db push --skip-generate", migrationEnv);
  if (!pushed) {
    console.warn("[build] db push falhou — tentando migrate deploy...");
    if (!tryRun("npx prisma migrate deploy", migrationEnv)) {
      console.error(
        "[build] Não foi possível aplicar o schema. " +
          "Defina DIRECT_URL (Neon direct, sem -pooler) ou use DATABASE_URL direct no build.",
      );
      process.exit(1);
    }
  }
}

run("npx next build");
