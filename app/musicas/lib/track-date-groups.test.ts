import assert from "node:assert/strict";
import { test } from "node:test";
import type { PreviewTrack } from "../../lib/google-drive";
import {
  flattenTrackSections,
  groupTracksByFolderDate,
  groupTracksByUploadDate,
} from "./track-date-groups";
import { parseUpdateDateFolder } from "../../lib/vip-music-slugs";

function track(partial: Partial<PreviewTrack> & Pick<PreviewTrack, "id" | "title">): PreviewTrack {
  return {
    artist: "",
    pack: "Pack",
    musicalKey: null,
    bpm: null,
    bpmFrom: null,
    bpmTo: null,
    version: null,
    editType: null,
    ...partial,
  };
}

test("parseUpdateDateFolder aceita 17-09-2026", () => {
  const parsed = parseUpdateDateFolder("17-09-2026");
  assert.deepEqual(parsed, {
    day: 17,
    month: 9,
    year: 2026,
    key: "2026-09-17",
    label: "17.09.2026",
  });
});

test("parseUpdateDateFolder rejeita mês textual", () => {
  assert.equal(parseUpdateDateFolder("04- ABRIL 2024"), null);
});

test("pasta com um único dia mostra a data", () => {
  const sections = groupTracksByUploadDate([
    track({ id: "1", title: "B", modifiedAt: "2026-09-10T15:00:00.000Z" }),
    track({ id: "2", title: "A", modifiedAt: "2026-09-10T12:00:00.000Z" }),
  ]);
  assert.equal(sections.length, 1);
  assert.equal(sections[0]?.isNew, false);
  assert.match(sections[0]?.title ?? "", /set|Hoje|Ontem|10/i);
  assert.deepEqual(
    sections[0]?.tracks.map((item) => item.id),
    ["1", "2"],
  );
});

test("todas as faixas ficam separadas por dia (mais recente primeiro)", () => {
  const sections = groupTracksByUploadDate([
    track({ id: "old-b", title: "B", modifiedAt: "2026-08-01T10:00:00.000Z" }),
    track({ id: "new-a", title: "A Nova", modifiedAt: "2026-09-11T18:00:00.000Z" }),
    track({ id: "old-a", title: "A", modifiedAt: "2026-08-01T09:00:00.000Z" }),
    track({ id: "mid", title: "Meio", modifiedAt: "2026-08-15T09:00:00.000Z" }),
    track({ id: "new-b", title: "B Nova", modifiedAt: "2026-09-11T20:00:00.000Z" }),
  ]);
  assert.equal(sections.length, 3);
  assert.equal(sections[0]?.title, "Adicionadas recentemente");
  assert.equal(sections[0]?.isNew, true);
  assert.deepEqual(
    sections[0]?.tracks.map((item) => item.id),
    ["new-b", "new-a"],
  );
  assert.equal(sections[1]?.isNew, false);
  assert.equal(sections[1]?.tracks.length, 1);
  assert.equal(sections[1]?.tracks[0]?.id, "mid");
  assert.deepEqual(
    sections[2]?.tracks.map((item) => item.id),
    ["old-a", "old-b"],
  );
  assert.deepEqual(
    flattenTrackSections(sections).map((item) => item.id),
    ["new-b", "new-a", "mid", "old-a", "old-b"],
  );
});

test("faixas sem data ficam no fim", () => {
  const sections = groupTracksByUploadDate([
    track({ id: "n", title: "Nova", modifiedAt: "2026-09-11T12:00:00.000Z" }),
    track({ id: "x", title: "Sem data" }),
  ]);
  assert.equal(sections.length, 2);
  assert.equal(sections[0]?.title, "Adicionadas recentemente");
  assert.equal(sections[1]?.title, "Sem data");
  assert.equal(sections[1]?.tracks[0]?.id, "x");
});

test("pastas DD-MM-YYYY viram seções fixas DD.MM.YYYY", () => {
  const sections = groupTracksByUploadDate([
    track({ id: "a", title: "A", updateDate: "2026-09-16" }),
    track({ id: "b", title: "B", updateDate: "2026-09-17" }),
    track({ id: "c", title: "C", updateDate: "2026-09-17" }),
  ]);
  assert.equal(sections.length, 2);
  assert.equal(sections[0]?.title, "17.09.2026");
  assert.equal(sections[0]?.kind, "folder");
  assert.deepEqual(
    sections[0]?.tracks.map((item) => item.id),
    ["b", "c"],
  );
  assert.equal(sections[1]?.title, "16.09.2026");
  assert.deepEqual(
    sections[1]?.tracks.map((item) => item.id),
    ["a"],
  );
});

test("groupTracksByFolderDate coloca faixas sem pasta no fim", () => {
  const sections = groupTracksByFolderDate([
    track({ id: "d", title: "Com data", updateDate: "2026-09-17" }),
    track({ id: "x", title: "Solta" }),
  ]);
  assert.equal(sections[0]?.title, "17.09.2026");
  assert.equal(sections[1]?.title, "Outras faixas");
  assert.equal(sections[1]?.tracks[0]?.id, "x");
});
