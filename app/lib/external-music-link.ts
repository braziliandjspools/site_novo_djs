import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_PRODUCTION_URL } from "./branding";
import { ensureAudioExtension } from "./google-drive";

export const EXTERNAL_LINK_TTL_SECONDS = 2 * 60 * 60;

type LinkPayload = { v: 1; fileId: string; name: string; exp: number };

/** A assinatura usa um segredo real do servidor; nunca o fallback local da sessão. */
export function externalLinkSecret() {
  const secret = (process.env.BRS_EXTERNAL_DOWNLOAD_SECRET || process.env.PORTAL_SESSION_SECRET || "").trim();
  return secret.length >= 32 ? secret : null;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`brs-external-download:v1:${payload}`).digest();
}

export function externalMusicFilename(fileName: string) {
  const clean = ensureAudioExtension(fileName);
  if (clean.length <= 180) return clean;
  const extension = clean.match(/\.(mp3|wav|flac|m4a|aac|ogg)$/i)?.[0] ?? ".mp3";
  return `${clean.slice(0, 180 - extension.length)}${extension}`;
}

/** Link for download managers must use the public host, even if Dokploy has a localhost URL configured. */
export function externalMusicDownloadUrl(token: string, filename: string) {
  return `${SITE_PRODUCTION_URL}/api/musicas/external/${token}/${filename}`;
}

export function createExternalMusicToken(fileId: string, fileName: string, secret: string, now = Date.now()) {
  if (!/^[a-zA-Z0-9_-]+$/.test(fileId) || secret.length < 32) throw new Error("Link indisponível.");
  const payload: LinkPayload = {
    v: 1,
    fileId,
    name: externalMusicFilename(fileName),
    exp: now + EXTERNAL_LINK_TTL_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret).toString("base64url")}`;
}

export function verifyExternalMusicToken(token: string, secret: string, now = Date.now()): LinkPayload | null {
  if (secret.length < 32 || token.length > 2048) return null;
  const match = /^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/.exec(token);
  if (!match) return null;
  const actual = Buffer.from(match[2], "base64url");
  const expected = signature(match[1], secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")) as LinkPayload;
    if (
      payload.v !== 1 ||
      !/^[a-zA-Z0-9_-]+$/.test(payload.fileId) ||
      typeof payload.name !== "string" || payload.name.length > 220 ||
      ensureAudioExtension(payload.name) !== payload.name ||
      !Number.isFinite(payload.exp) || payload.exp <= now ||
      payload.exp > now + EXTERNAL_LINK_TTL_SECONDS * 1000
    ) return null;
    return payload;
  } catch {
    return null;
  }
}
