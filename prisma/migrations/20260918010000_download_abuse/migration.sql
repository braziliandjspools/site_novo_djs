-- Alerta/ban por abuso de download (teste em massa / loop do acervo).

ALTER TABLE "portal_users"
  ADD COLUMN IF NOT EXISTS "download_banned_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "download_ban_reason" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "download_abuse_alert_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "download_abuse_alert_reason" VARCHAR(500);

CREATE TABLE IF NOT EXISTS "download_file_hits" (
  "id" BIGSERIAL NOT NULL,
  "portal_user_id" INTEGER NOT NULL,
  "file_id" VARCHAR(128) NOT NULL,
  "kind" VARCHAR(16) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "download_file_hits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "download_file_hits_user_created_idx"
  ON "download_file_hits"("portal_user_id", "created_at");

CREATE INDEX IF NOT EXISTS "download_file_hits_user_file_created_idx"
  ON "download_file_hits"("portal_user_id", "file_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'download_file_hits_portal_user_id_fkey'
  ) THEN
    ALTER TABLE "download_file_hits"
      ADD CONSTRAINT "download_file_hits_portal_user_id_fkey"
      FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
