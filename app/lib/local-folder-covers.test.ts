import assert from "node:assert/strict";
import test from "node:test";
import { localFolderCoverUrl, resolveFolderCoverUrl } from "./local-folder-covers";

test("resolve capa local por nome BRS PACKS 2025/2026", () => {
  assert.equal(localFolderCoverUrl("BRS - PACKS 2025"), "/musicas/folder-covers/brs-packs-2025.jpg");
  assert.equal(localFolderCoverUrl("BRS - PACKS 2026"), "/musicas/folder-covers/brs-packs-2026.jpg");
  assert.equal(localFolderCoverUrl("Packs 2026"), "/musicas/folder-covers/brs-packs-2026.jpg");
});

test("local tem prioridade sobre drive", () => {
  assert.equal(
    resolveFolderCoverUrl({
      folderName: "BRS - PACKS 2025",
      driveCoverUrl: "/api/musicas/cover/abc",
    }),
    "/musicas/folder-covers/brs-packs-2025.jpg",
  );
});
