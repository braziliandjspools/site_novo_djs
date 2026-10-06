import assert from "node:assert/strict";
import { test } from "node:test";
import { GET, OPTIONS } from "../app/api/downloader/updates/latest/route";
import { APP_CHANGELOG } from "../apps/downloader/src/lib/app-info";
import { compareSemver } from "../app/lib/downloader-updates";
import { existsSync } from "node:fs";

const latest = "1.0.33";
const previous = APP_CHANGELOG.map(entry => entry.version).filter(version => compareSemver(version, latest) < 0);
for (const current of [...previous, "1.0.16", "v1.0.15", "1.0.16-estable", "0.0.0"]) {
  test(current + " receives " + latest + " from the legacy update endpoint", async () => {
    const response = await GET(new Request("https://www.brazilianremixservice.com.br/api/downloader/updates/latest?current=" + encodeURIComponent(current), {
      headers: { Origin: "https://tauri.localhost", "X-BP-Client": "downloader" },
    }));
    const body = await response.json();
    assert.equal(body.updateAvailable, true);
    assert.equal(body.latest.version, latest);
    assert.equal(body.latest.platform, "windows");
    assert.equal(body.currentVersion, current);
    const path = new URL(body.latest.downloadUrl).pathname;
    assert.ok(existsSync("public" + path), "installer must exist");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://tauri.localhost");
  });
}
for (const current of [latest, "1.0.33", "2.0.0"]) {
  test(current + " is never offered a downgrade", async () => {
    const response = await GET(new Request("https://example.com/api/downloader/updates/latest?current=" + current));
    const body = await response.json();
    assert.equal(body.updateAvailable, false);
    assert.equal(body.latest, null);
  });
}
test("missing version supports oldest clients", async () => {
  const response = await GET(new Request("https://example.com/api/downloader/updates/latest"));
  assert.equal((await response.json()).latest.version, latest);
});
test("desktop preflight succeeds", async () => {
  const response = await OPTIONS(new Request("https://example.com/api/downloader/updates/latest", {
    method: "OPTIONS", headers: { Origin: "tauri://localhost" },
  }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "tauri://localhost");
});
