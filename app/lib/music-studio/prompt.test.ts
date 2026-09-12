import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMusicPrompt } from "./prompt";

describe("buildMusicPrompt", () => {
  it("includes title, style and portuguese vocals by default", () => {
    const prompt = buildMusicPrompt({
      title: "Noite no Rio",
      style: "Brazilian Funk",
      prompt: "energia de pista",
    });
    assert.match(prompt, /Noite no Rio/);
    assert.match(prompt, /Brazilian Funk/);
    assert.match(prompt, /Brazilian Portuguese/);
    assert.match(prompt, /energia de pista/);
  });

  it("marks instrumental when requested", () => {
    const prompt = buildMusicPrompt({
      title: "Loop",
      instrumental: true,
    });
    assert.match(prompt, /instrumental only/i);
  });
});
