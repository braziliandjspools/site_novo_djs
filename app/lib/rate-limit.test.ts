import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRateLimit } from "./rate-limit";

test("rate limit permite até o limite e depois bloqueia", () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  const windowMs = 60_000;

  assert.equal(checkRateLimit({ key, limit: 2, windowMs }).ok, true);
  assert.equal(checkRateLimit({ key, limit: 2, windowMs }).ok, true);
  const blocked = checkRateLimit({ key, limit: 2, windowMs });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec >= 1);
});
