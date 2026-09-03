import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildStressCatalogJobs,
  countFinderJobs,
  filterFinderJobs,
  mergeDownloadCatalog,
} from "./job-finder.ts";
import type { DownloadJob } from "../api/jobs";

function tinyJob(overrides: Partial<DownloadJob> & Pick<DownloadJob, "id" | "status">): DownloadJob {
  const { id, status, ...rest } = overrides;
  return {
    id,
    provider: "google_drive",
    fileId: `file-${id}`,
    fileName: "track.mp3",
    relativePath: "funk/semana-01/track.mp3",
    targetDeviceId: null,
    fileSize: null,
    mimeType: null,
    status,
    progress: 0,
    downloadedBytes: "0",
    totalBytes: null,
    error: null,
    deviceId: null,
    deviceName: null,
    claimedAt: null,
    startedAt: null,
    completedAt: null,
    dismissedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...rest,
  };
}

test("filterFinderJobs busca local por nome, pasta, categoria e status", () => {
  const jobs = [
    tinyJob({ id: 1, status: "DOWNLOADING", fileName: "Samba Hits.mp3", relativePath: "samba/a.mp3" }),
    tinyJob({ id: 2, status: "PENDING", fileName: "Funk Mix.mp3", provider: "mega", relativePath: "funk/b.mp3" }),
    tinyJob({ id: 3, status: "FAILED", fileName: "Pagode.mp3", relativePath: "pagode/c.mp3" }),
  ];

  assert.equal(filterFinderJobs(jobs, { query: "samba", filter: "all" }).visible.length, 1);
  assert.equal(filterFinderJobs(jobs, { query: "funk", filter: "all" }).visible.length, 1);
  assert.equal(filterFinderJobs(jobs, { query: "mega", filter: "all" }).visible.length, 1);
  assert.equal(filterFinderJobs(jobs, { query: "falhou", filter: "all" }).visible.length, 1);
  assert.equal(filterFinderJobs(jobs, { query: "baixando", filter: "all" }).visible.length, 1);
});

test("contadores e filtros com 500 itens (local, sem rede)", () => {
  const jobs = buildStressCatalogJobs(500);
  assert.equal(jobs.length, 500);

  const { counts, visible } = filterFinderJobs(jobs, { query: "", filter: "all" });
  assert.equal(counts.all, 500);
  assert.equal(visible.length, 500);
  assert.ok(counts.downloading > 0);
  assert.ok(counts.queued > 0);
  assert.ok(counts.completed > 0);
  assert.ok(counts.failed > 0);
  assert.ok(counts.paused > 0);
  assert.equal(
    counts.downloading + counts.queued + counts.completed + counts.failed + counts.paused,
    500,
  );

  const downloading = filterFinderJobs(jobs, { query: "", filter: "downloading" });
  assert.equal(downloading.visible.length, counts.downloading);
  assert.ok(downloading.visible.every((job) => job.status === "DOWNLOADING"));

  const searched = filterFinderJobs(jobs, { query: "estilo-1", filter: "all" });
  assert.ok(searched.visible.length > 0);
  assert.ok(searched.visible.length < 500);
  assert.equal(countFinderJobs(searched.visible).all, searched.counts.all);

  const started = performance.now();
  for (let i = 0; i < 20; i += 1) {
    filterFinderJobs(jobs, { query: "track 01", filter: "queued" });
  }
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 500, `filtro local lento demais: ${elapsed.toFixed(1)}ms`);
});

test("mergeDownloadCatalog prioriza manager e remove dismissed", () => {
  const server = [
    tinyJob({ id: 1, status: "PENDING", fileName: "server.mp3" }),
    tinyJob({ id: 2, status: "COMPLETED", dismissedAt: new Date().toISOString() }),
  ];
  const manager = [tinyJob({ id: 1, status: "DOWNLOADING", fileName: "local.mp3", progress: 40 })];
  const merged = mergeDownloadCatalog(manager, server);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].status, "DOWNLOADING");
  assert.equal(merged[0].fileName, "local.mp3");
});
