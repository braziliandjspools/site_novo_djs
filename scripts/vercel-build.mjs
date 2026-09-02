import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function tryRun(command) {
  try {
    run(command);
    return true;
  } catch {
    return false;
  }
}

run("npx prisma generate");

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.warn("[build] DATABASE_URL não definida — pulando setup do banco.");
} else {
  const migrated = tryRun("npx prisma migrate deploy");
  if (!migrated) {
    console.warn("[build] migrate deploy falhou — tentando db push...");
    if (!tryRun("npx prisma db push --skip-generate")) {
      console.error(
        "[build] Não foi possível aplicar o schema. " +
          "Confirme DATABASE_URL (URL direct do Neon, sem -pooler) nas env vars de Build.",
      );
      process.exit(1);
    }
  }
}

run("npx next build");
