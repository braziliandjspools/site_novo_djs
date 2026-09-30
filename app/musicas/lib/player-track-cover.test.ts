import assert from "node:assert/strict";
import test from "node:test";
import { playerTrackCoverUrl } from "./player-track-cover";

test("player artwork URL includes track id and cache version", () => {
  assert.equal(
    playerTrackCoverUrl({ id: "drive_id-1", modifiedAt: "2026-09-28T12:00:00.000Z" }, "404"),
    "/api/musicas/player-cover/drive_id-1?m=2026-09-28T12%3A00%3A00.000Z&fallback=404",
  );
});
