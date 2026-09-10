import assert from "node:assert/strict";
import { test } from "node:test";

import {
  UNKNOWN_ARTIST_LABEL,
  getTrackDisplayMetadata,
  safeSplitArtistTitle,
} from "./track-display-metadata.ts";

test("Prince Ital Joe Feat. Marky Mark - United (Extended Version)", () => {
  const meta = getTrackDisplayMetadata({
    title: "Prince Ital Joe Feat. Marky Mark - United (Extended Version)",
    artist: "Prince Ital Joe Feat. Marky Mark",
  });
  assert.equal(meta.title, "United (Extended Version)");
  assert.equal(meta.artist, "Prince Ital Joe Feat. Marky Mark");
});

test("Madonna - Like A Prayer (Extended Mix)", () => {
  const meta = getTrackDisplayMetadata({
    title: "Madonna - Like A Prayer (Extended Mix)",
    artist: "",
  });
  assert.equal(meta.title, "Like A Prayer (Extended Mix)");
  assert.equal(meta.artist, "Madonna");
});

test("Whitney Houston - I Wanna Dance With Somebody (12 Inch Mix)", () => {
  const meta = getTrackDisplayMetadata({
    title: "Whitney Houston - I Wanna Dance With Somebody (12 Inch Mix)",
  });
  assert.equal(meta.title, "I Wanna Dance With Somebody (12 Inch Mix)");
  assert.equal(meta.artist, "Whitney Houston");
});

test("Earth, Wind & Fire - September (Extended)", () => {
  const meta = getTrackDisplayMetadata({
    title: "Earth, Wind & Fire - September (Extended)",
  });
  assert.equal(meta.title, "September (Extended)");
  assert.equal(meta.artist, "Earth, Wind & Fire");
});

test("AC-DC - Back In Black preserva hífen no artista", () => {
  const meta = getTrackDisplayMetadata({
    title: "AC-DC - Back In Black",
  });
  assert.equal(meta.title, "Back In Black");
  assert.equal(meta.artist, "AC-DC");
  assert.deepEqual(safeSplitArtistTitle("AC-DC - Back In Black"), {
    title: "Back In Black",
    artist: "AC-DC",
  });
});

test("remove extensão só na apresentação", () => {
  const meta = getTrackDisplayMetadata({
    title: "Prince Ital Joe Feat. Marky Mark - United (Extended Version).mp3",
    artist: "Prince Ital Joe Feat. Marky Mark",
  });
  assert.equal(meta.title, "United (Extended Version)");
  assert.equal(meta.artist, "Prince Ital Joe Feat. Marky Mark");
});

test("nome confuso permanece original com Artista desconhecido", () => {
  const meta = getTrackDisplayMetadata({
    title: "TRACK__004_FINAL___80S_EDIT__V2",
    artist: "",
  });
  assert.equal(meta.title, "TRACK__004_FINAL___80S_EDIT__V2");
  assert.equal(meta.artist, UNKNOWN_ARTIST_LABEL);
});

test("nome confuso com underscores e data", () => {
  const meta = getTrackDisplayMetadata({
    title: "DJ___MIX__2024--TRACK_001__FINAL",
  });
  assert.equal(meta.title, "DJ___MIX__2024--TRACK_001__FINAL");
  assert.equal(meta.artist, UNKNOWN_ARTIST_LABEL);
});

test("01_PRINCE__UNITED_EXTENDED_V2_FINAL_320___", () => {
  const meta = getTrackDisplayMetadata({
    title: "01_PRINCE__UNITED_EXTENDED_V2_FINAL_320___",
  });
  assert.equal(meta.title, "01_PRINCE__UNITED_EXTENDED_V2_FINAL_320___");
  assert.equal(meta.artist, UNKNOWN_ARTIST_LABEL);
});

test("metadados estruturados limpos têm prioridade sobre parser", () => {
  const meta = getTrackDisplayMetadata({
    title: "United (Extended Version)",
    artist: "Prince Ital Joe Feat. Marky Mark",
    fileName: "Something Else - Wrong Title.mp3",
  });
  assert.equal(meta.title, "United (Extended Version)");
  assert.equal(meta.artist, "Prince Ital Joe Feat. Marky Mark");
});

test("não separa apenas por hífen sem espaços", () => {
  const meta = getTrackDisplayMetadata({
    title: "SomeTrack-NameWithoutSpaces",
    artist: "",
  });
  assert.equal(meta.title, "SomeTrack-NameWithoutSpaces");
  assert.equal(meta.artist, UNKNOWN_ARTIST_LABEL);
});
