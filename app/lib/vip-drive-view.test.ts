import assert from "node:assert/strict";
import test from "node:test";
import { googleDriveFileLink, isGmailAccount, verifyVipDriveFile } from "./vip-drive-view-policy";

test("Drive eligibility uses the registered Gmail domain", () => {
  assert.equal(isGmailAccount(" dj@GMAIL.com "), true);
  assert.equal(isGmailAccount("dj@gmail.com.br"), false);
  assert.equal(isGmailAccount("dj@other.com"), false);
});

test("Google Drive link contains only the validated file identifier", () => {
  assert.equal(googleDriveFileLink("abc_123-Z"), "https://drive.google.com/file/d/abc_123-Z/view");
  assert.throws(() => googleDriveFileLink("abc/../private"));
});

test("Drive file must be audio and descended from the configured catalog root", async () => {
  const files = new Map([
    ["track", { id: "track", name: "Mix.mp3", mimeType: "audio/mpeg", parents: ["style"] }],
    ["style", { id: "style", name: "House", mimeType: "application/vnd.google-apps.folder", parents: ["root"] }],
    ["foreign", { id: "foreign", name: "Private.mp3", mimeType: "audio/mpeg", parents: ["other"] }],
    ["other", { id: "other", name: "Other", mimeType: "application/vnd.google-apps.folder", parents: [] }],
  ]);
  const read = async (id: string) => files.get(id) ?? null;
  assert.equal(await verifyVipDriveFile("track", "root", read), "Mix.mp3");
  assert.equal(await verifyVipDriveFile("foreign", "root", read), null);
  assert.equal(await verifyVipDriveFile("style", "root", read), null);
  assert.equal(await verifyVipDriveFile("missing", "root", read), null);
});
