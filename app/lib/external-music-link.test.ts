import assert from "node:assert/strict";
import test from "node:test";
import {
  createExternalMusicToken,
  externalMusicDownloadUrl,
  externalMusicFilename,
  verifyExternalMusicToken,
  EXTERNAL_LINK_TTL_SECONDS,
} from "./external-music-link";
import { GET, HEAD } from "../api/musicas/external/[token]/[filename]/route";

const secret = "brs-test-secret-with-at-least-32-characters";
const now = Date.UTC(2026, 8, 28);

test("link para downloader usa domínio público mesmo com NEXT_PUBLIC_SITE_URL local", () => {
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  try {
    assert.equal(
      externalMusicDownloadUrl("signed-token", "Faixa%20de%20teste.mp3"),
      "https://www.brazilianremixservice.com.br/api/musicas/external/signed-token/Faixa%20de%20teste.mp3",
    );
  } finally {
    if (previousSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  }
});

test("link direto é restrito à faixa, ao nome e a duas horas", () => {
  const token = createExternalMusicToken("drive_123", "Minha Música.mp3", secret, now);
  assert.deepEqual(verifyExternalMusicToken(token, secret, now + 1000), {
    v: 1,
    fileId: "drive_123",
    name: "Minha Música.mp3",
    exp: now + EXTERNAL_LINK_TTL_SECONDS * 1000,
  });
  assert.equal(verifyExternalMusicToken(token, secret, now + EXTERNAL_LINK_TTL_SECONDS * 1000), null);
  assert.equal(verifyExternalMusicToken(token, "wrong-secret-with-at-least-32-characters", now), null);
  assert.equal(verifyExternalMusicToken(`${token}x`, secret, now), null);
  assert.throws(() => createExternalMusicToken("../other", "faixa.mp3", secret, now));
});

test("nome de download preserva extensão e não aceita caminho", () => {
  assert.equal(externalMusicFilename("pasta/Track.wav"), "pasta_Track.wav");
  assert.match(externalMusicFilename("X".repeat(300) + ".flac"), /\.flac$/);
  assert.ok(externalMusicFilename("X".repeat(300) + ".flac").length <= 180);
});

test("link assinado entrega áudio direto com HEAD, Range e nome do arquivo", async () => {
  const previousSecret = process.env.BRS_EXTERNAL_DOWNLOAD_SECRET;
  const previousFetch = globalThis.fetch;
  process.env.BRS_EXTERNAL_DOWNLOAD_SECRET = secret;
  globalThis.fetch = async (_input, init) => {
    const range = new Headers(init?.headers).get("Range");
    return new Response(new Uint8Array(range ? [1] : [1, 2, 3]), {
      status: range ? 206 : 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": range ? "1" : "3",
        "Accept-Ranges": "bytes",
        ...(range ? { "Content-Range": "bytes 0-0/3" } : {}),
      },
    });
  };
  try {
    const token = createExternalMusicToken("track_1", "Faixa.mp3", secret);
    const context = { params: Promise.resolve({ token, filename: "Faixa.mp3" }) };
    const url = `https://www.brazilianremixservice.com.br/api/musicas/external/${token}/Faixa.mp3`;
    const head = await HEAD(new Request(url, { method: "HEAD" }), context);
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("Content-Length"), "3");
    assert.match(head.headers.get("Content-Disposition") ?? "", /Faixa\.mp3/);
    const get = await GET(new Request(url), context);
    assert.equal(get.status, 200);
    assert.equal(get.headers.get("Content-Type"), "audio/mpeg");
    assert.deepEqual([...new Uint8Array(await get.arrayBuffer())], [1, 2, 3]);
    const partial = await GET(new Request(url, { headers: { Range: "bytes=0-0" } }), context);
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get("Content-Range"), "bytes 0-0/3");
    assert.deepEqual([...new Uint8Array(await partial.arrayBuffer())], [1]);
    const invalid = await GET(new Request(url), {
      params: Promise.resolve({ token: `${token}x`, filename: "Faixa.mp3" }),
    });
    assert.equal(invalid.status, 403);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousSecret === undefined) delete process.env.BRS_EXTERNAL_DOWNLOAD_SECRET;
    else process.env.BRS_EXTERNAL_DOWNLOAD_SECRET = previousSecret;
  }
});
