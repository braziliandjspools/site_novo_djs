import { createHash, randomBytes } from "node:crypto";

/** Validade do link enviado por e-mail. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isPlausibleResetToken(token: string) {
  return /^[A-Za-z0-9_-]{32,128}$/.test(token);
}

export function isResetTokenExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

export function passwordResetError(password: string) {
  if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  if (password.length > 72) return "A senha deve ter no máximo 72 caracteres.";
  return null;
}

export function passwordResetExpiresAt(now = Date.now()) {
  return new Date(now + RESET_TOKEN_TTL_MS);
}
