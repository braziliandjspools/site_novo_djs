import assert from "node:assert/strict";
import { test } from "node:test";
import type { PreviewTrack } from "../../lib/google-drive";
import { flattenTrackSections, groupTracksByUploadDate } from "./track-date-groups";

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
  assert.equal(sections[0]?.title, "Novas");
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
  assert.equal(sections[0]?.title, "Novas");
  assert.equal(sections[1]?.title, "Sem data");
  assert.equal(sections[1]?.tracks[0]?.id, "x");
});
