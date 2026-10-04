import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateResetToken,
  hashResetToken,
  isPlausibleResetToken,
  isResetTokenExpired,
  passwordResetError,
  passwordResetExpiresAt,
  RESET_TOKEN_TTL_MS,
} from "./password-reset-token";

test("token de redefinição é plausível e o hash é estável", () => {
  const token = generateResetToken();
  assert.equal(isPlausibleResetToken(token), true);
  assert.equal(isPlausibleResetToken("curto"), false);
  assert.equal(isPlausibleResetToken(`${token}!`), false);
  assert.equal(hashResetToken(token), hashResetToken(token));
  assert.notEqual(hashResetToken(token), token);
  assert.equal(hashResetToken(token).length, 64);
});

test("link expira depois de uma hora e a senha segue o mínimo do cadastro", () => {
  const now = new Date("2026-10-04T12:00:00.000Z");
  const expiresAt = passwordResetExpiresAt(now.getTime());
  assert.equal(expiresAt.getTime() - now.getTime(), RESET_TOKEN_TTL_MS);
  assert.equal(isResetTokenExpired(expiresAt, now), false);
  assert.equal(isResetTokenExpired(expiresAt, new Date(expiresAt.getTime())), true);
  assert.equal(passwordResetError("12345"), "A senha deve ter pelo menos 6 caracteres.");
  assert.equal(passwordResetError("123456"), null);
  assert.equal(passwordResetError("a".repeat(73)), "A senha deve ter no máximo 72 caracteres.");
});
