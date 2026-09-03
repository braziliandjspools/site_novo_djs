import assert from "node:assert/strict";
import test from "node:test";
import { compareSemver } from "./semver.ts";

test("compareSemver detecta versão maior", () => {
  assert.ok(compareSemver("0.3.0", "0.2.0") > 0);
  assert.ok(compareSemver("0.2.0", "0.3.0") < 0);
  assert.equal(compareSemver("0.2.0", "0.2.0"), 0);
  assert.ok(compareSemver("v1.0.1", "1.0.0") > 0);
});
