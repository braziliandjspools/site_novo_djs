import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT to_regclass('public.portal_users')::text AS table_name
  `;
  const exists = Boolean(rows?.[0]?.table_name);

  if (exists) {
    console.log("[db] portal_users já existe.");
    return;
  }

  console.warn("[db] portal_users não existe. Sincronizando o schema Prisma do Portal...");
  execSync("npx prisma db push --schema prisma/schema.prisma --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });
  console.log("[db] Schema do Portal inicializado.");
}

main()
  .catch((error) => {
    console.error("[db] Falha ao inicializar o schema do Portal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
