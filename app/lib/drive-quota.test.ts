import assert from "node:assert/strict";
import { test } from "node:test";
import { publicDriveResponseNeedsOwnerProxy } from "./drive-audio-stream";

test("áudio público não cai no proxy", () => {
  assert.equal(
    publicDriveResponseNeedsOwnerProxy({
      status: 206,
      contentType: "audio/mpeg",
      bodyText: "",
    }),
    false,
  );
});

test("página de cota do Drive cai no proxy OAuth", () => {
  assert.equal(
    publicDriveResponseNeedsOwnerProxy({
      status: 200,
      contentType: "text/html; charset=utf-8",
      bodyText: "Too many users have viewed or downloaded this file recently",
    }),
    true,
  );
});

test("403 do link público cai no proxy OAuth", () => {
  assert.equal(
    publicDriveResponseNeedsOwnerProxy({
      status: 403,
      contentType: "application/json",
      bodyText: '{"error":{"errors":[{"reason":"downloadQuotaExceeded"}]}}',
    }),
    true,
  );
});
