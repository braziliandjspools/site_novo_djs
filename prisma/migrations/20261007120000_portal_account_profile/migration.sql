CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  portal_user_id INTEGER NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP(3) NOT NULL,
  used_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  new_password_hash TEXT
);
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS new_password_hash TEXT;
CREATE INDEX IF NOT EXISTS password_reset_tokens_portal_user_id_created_at_idx
  ON password_reset_tokens(portal_user_id, created_at);

ALTER TABLE portal_users ADD COLUMN IF NOT EXISTS profile_image_key TEXT;
