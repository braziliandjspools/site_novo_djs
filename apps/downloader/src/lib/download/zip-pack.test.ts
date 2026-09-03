import assert from "node:assert/strict";
import test from "node:test";
import {
  buildZipPlan,
  isTemporaryZipNoise,
  packStillHasActiveJobs,
  resolveArchivePath,
  resolvePackKey,
  sanitizeZipBaseName,
} from "./zip-pack.ts";
import { ZipCoordinator } from "./zip-coordinator.ts";

test("sanitize remove caracteres inválidos do Windows", () => {
  assert.equal(sanitizeZipBaseName("Julho 2026?/Pack"), "Julho 2026Pack");
  assert.equal(sanitizeZipBaseName("   "), "Downloads");
  assert.equal(sanitizeZipBaseName("Funk Light Agosto 2026"), "Funk Light Agosto 2026");
});

test("pack key usa primeiro segmento do relativePath", () => {
  assert.equal(resolvePackKey("Julho 2026/SEMANA 01/Funk/a.mp3", "a.mp3"), "Julho 2026");
  assert.equal(resolvePackKey("Pack/Funk/faixa1.mp3", "faixa1.mp3"), "Pack");
  assert.equal(resolvePackKey(null, "musica.mp3"), "musica");
});

test("archive path preserva subpastas sem o pack raiz", () => {
  assert.equal(
    resolveArchivePath("Pack/Funk/faixa1.mp3", "D:/dl/Pack/Funk/faixa1.mp3", "faixa1.mp3"),
    "Funk/faixa1.mp3",
  );
  assert.equal(
    resolveArchivePath(
      "Julho 2026/SEMANA 01/Funk/a.mp3",
      "D:/dl/Julho 2026/SEMANA 01/Funk/a (1).mp3",
      "a.mp3",
    ),
    "SEMANA 01/Funk/a (1).mp3",
  );
});

test("ignora .part e temporários", () => {
  assert.equal(isTemporaryZipNoise("a.mp3.part"), true);
  assert.equal(isTemporaryZipNoise("a.mp3"), false);
  const plan = buildZipPlan("Pack", [
    { jobId: 1, absolutePath: "D:/dl/Pack/a.mp3", archivePath: "a.mp3" },
    { jobId: 2, absolutePath: "D:/dl/Pack/a.mp3.part", archivePath: "a.mp3.part" },
  ]);
  assert.equal(plan?.files.length, 1);
});

test("aguarda jobs ativos do mesmo pack", () => {
  assert.equal(
    packStillHasActiveJobs("Julho 2026", [
      { relativePath: "Julho 2026/a.mp3", fileName: "a.mp3", status: "DOWNLOADING" },
    ]),
    true,
  );
  assert.equal(
    packStillHasActiveJobs("Julho 2026", [
      { relativePath: "Agosto 2026/a.mp3", fileName: "a.mp3", status: "DOWNLOADING" },
    ]),
    false,
  );
});

test("coordenador compacta após último arquivo e não bloqueia fila sequencial", async () => {
  const calls: string[] = [];
  const coordinator = new ZipCoordinator({
    createZip: async ({ taskId, files }) => {
      calls.push(taskId);
      assert.equal(files.length >= 1, true);
      await new Promise((r) => setTimeout(r, 5));
      return { zipPath: `D:/dl/${taskId}.zip`, fileCount: files.length, cancelled: false };
    },
    cancelZip: async () => true,
    onChange: () => undefined,
  });
  coordinator.setEnabled(true);

  coordinator.recordCompleted({
    jobId: 1,
    fileName: "a.mp3",
    relativePath: "Pack/Funk/a.mp3",
    absolutePath: "D:/dl/Pack/Funk/a.mp3",
    activeJobs: [{ relativePath: "Pack/Funk/b.mp3", fileName: "b.mp3", status: "DOWNLOADING" }],
  });
  assert.equal(coordinator.listTasks().length, 0);

  coordinator.recordCompleted({
    jobId: 2,
    fileName: "b.mp3",
    relativePath: "Pack/Funk/b.mp3",
    absolutePath: "D:/dl/Pack/Funk/b.mp3",
    activeJobs: [],
  });

  await new Promise((r) => setTimeout(r, 40));
  const tasks = coordinator.listTasks();
  assert.equal(calls.length, 1);
  assert.equal(tasks[0]?.status, "completed");
  assert.equal(tasks[0]?.zipPath?.endsWith("Pack.zip"), true);
});

test("cancelamento durante fila remove tarefa enfileirada", async () => {
  const gate = { resolve: null as null | (() => void) };
  const coordinator = new ZipCoordinator({
    createZip: async ({ taskId }) => {
      if (taskId === "A") {
        await new Promise<void>((resolve) => {
          gate.resolve = resolve;
        });
      }
      return { zipPath: `D:/dl/${taskId}.zip`, fileCount: 1, cancelled: false };
    },
    cancelZip: async () => true,
    onChange: () => undefined,
  });
  coordinator.setEnabled(true);

  coordinator.recordCompleted({
    jobId: 1,
    fileName: "a.mp3",
    relativePath: "A/a.mp3",
    absolutePath: "D:/dl/A/a.mp3",
    activeJobs: [],
  });
  coordinator.recordCompleted({
    jobId: 2,
    fileName: "b.mp3",
    relativePath: "B/b.mp3",
    absolutePath: "D:/dl/B/b.mp3",
    activeJobs: [],
  });

  await new Promise((r) => setTimeout(r, 10));
  await coordinator.cancelTask("B");
  gate.resolve?.();
  await new Promise((r) => setTimeout(r, 20));

  const b = coordinator.listTasks().find((t) => t.id === "B");
  assert.equal(b?.status, "cancelled");
});

test("nomes com acentos e longos", () => {
  const long = "á".repeat(90);
  const name = sanitizeZipBaseName(`Março ${long}`);
  assert.ok(name.startsWith("Março"));
  assert.ok(name.length <= 120);
  assert.equal(resolvePackKey("Março 2026/Música.mp3", "Música.mp3"), "Março 2026");
});
