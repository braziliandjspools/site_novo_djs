import assert from "node:assert/strict";
import { test } from "node:test";

import type { DownloadJob } from "../api/jobs";
import {
  collectOrgFacets,
  extractJobOrgMeta,
  filterJobsByOrgMeta,
  groupJobsByOrg,
} from "./job-organization.ts";

function job(overrides: Partial<DownloadJob> & Pick<DownloadJob, "id">): DownloadJob {
  const { id, ...rest } = overrides;
  return {
    id,
    provider: "GOOGLE_DRIVE",
    fileId: `file-${id}`,
    fileName: "track.mp3",
    relativePath: null,
    targetDeviceId: null,
    fileSize: null,
    mimeType: null,
    status: "COMPLETED",
    progress: 100,
    downloadedBytes: "0",
    totalBytes: null,
    error: null,
    deviceId: null,
    deviceName: null,
    claimedAt: null,
    startedAt: null,
    completedAt: null,
    dismissedAt: null,
    createdAt: "2026-09-03T12:00:00.000Z",
    updatedAt: "2026-09-03T12:00:00.000Z",
    ...rest,
  };
}

test("extrai mês, semana, gênero e pasta do relativePath real do site", () => {
  const meta = extractJobOrgMeta(
    job({
      id: 1,
      fileName: "Artist - Track (Radio Edit).mp3",
      relativePath: "Julho 2026/SEMANA 01/Funk/Artist - Track (Radio Edit).mp3",
    }),
  );
  assert.equal(meta.month, "Julho 2026");
  assert.equal(meta.week, "Semana 01");
  assert.equal(meta.genre, "Funk");
  assert.equal(meta.category, "Funk");
  assert.equal(meta.folder, "Julho 2026/SEMANA 01/Funk");
  assert.equal(meta.editType, "Radio Edit");
  assert.equal(meta.pool, null);
});

test("detecta pool no fileName só quando o token existe", () => {
  const withPool = extractJobOrgMeta(
    job({
      id: 2,
      fileName: "DMC Mega Mix 314 - Hit.mp3",
      relativePath: "Agosto 2026/SEMANA 02/House/DMC Mega Mix 314 - Hit.mp3",
    }),
  );
  assert.equal(withPool.pool, "DMC");

  const facets = collectOrgFacets([
    job({
      id: 3,
      fileName: "Ultimix 315 - Party.mp3",
      relativePath: "Agosto 2026/SEMANA 02/Pop/Ultimix 315 - Party.mp3",
    }),
    job({
      id: 4,
      fileName: "Clean Track.mp3",
      relativePath: "Agosto 2026/SEMANA 02/Pop/Clean Track.mp3",
    }),
  ]);
  assert.deepEqual(facets.pool, ["Ultimix"]);
  assert.ok(facets.genre.includes("Pop"));
  assert.equal(facets.genre.includes("Sertanejo"), false);
});

test("filtra e agrupa localmente sem inventar categorias", () => {
  const jobs = [
    job({
      id: 1,
      fileName: "a.mp3",
      relativePath: "Setembro 2026/SEMANA 01/Funk/a.mp3",
      createdAt: "2026-09-01T10:00:00.000Z",
    }),
    job({
      id: 2,
      fileName: "b.mp3",
      relativePath: "Setembro 2026/SEMANA 01/House/b.mp3",
      createdAt: "2026-09-02T10:00:00.000Z",
    }),
  ];

  const filtered = filterJobsByOrgMeta(jobs, {
    genre: "Funk",
    pool: null,
    month: null,
    category: null,
    folder: null,
    editType: null,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 1);

  const groups = groupJobsByOrg(jobs, "category");
  assert.equal(groups.length, 2);
  assert.ok(groups.some((group) => group.label === "Funk"));
  assert.ok(groups.some((group) => group.label === "House"));
});
