import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  captureSyncSnapshot,
  diffSyncSnapshots,
  formatSyncDeltaToast,
  hasSyncDeltaNews,
} from "./sync-delta";

describe("sync-delta", () => {
  it("detecta pastas e faixas novas pelo id", () => {
    const before = captureSyncSnapshot({
      folders: [{ id: "a", name: "Antiga" }],
      tracks: [{ id: "t1", title: "Track 1" }],
    });
    const after = captureSyncSnapshot({
      folders: [
        { id: "a", name: "Antiga" },
        { id: "b", name: "Funk" },
      ],
      tracks: [
        { id: "t1", title: "Track 1" },
        { id: "t2", title: "Nova faixa" },
      ],
    });
    const delta = diffSyncSnapshots(before, after);
    assert.equal(delta.newFolders.length, 1);
    assert.equal(delta.newFolders[0]?.name, "Funk");
    assert.equal(delta.newTracks.length, 1);
    assert.equal(delta.newTracks[0]?.name, "Nova faixa");
    assert.equal(hasSyncDeltaNews(delta), true);
    assert.match(formatSyncDeltaToast(delta, "nesta pasta"), /Funk/);
    assert.match(formatSyncDeltaToast(delta, "nesta pasta"), /Nova faixa/);
  });

  it("informa quando não há novidades", () => {
    const snap = captureSyncSnapshot({
      folders: [{ id: "a", name: "Pack" }],
      tracks: [],
    });
    const delta = diffSyncSnapshots(snap, snap);
    assert.equal(hasSyncDeltaNews(delta), false);
    assert.match(formatSyncDeltaToast(delta), /nenhuma pasta ou música nova/);
  });
});
