-- Cota do BRS Downloader por plano (STARTER/PRO/MAX).

CREATE TYPE "DownloaderQuotaTier" AS ENUM ('STARTER', 'PRO', 'MAX');

ALTER TABLE "portal_users"
  ADD COLUMN IF NOT EXISTS "downloader_quota_tier" "DownloaderQuotaTier" NOT NULL DEFAULT 'STARTER';

CREATE TABLE IF NOT EXISTS "downloader_quota_states" (
  "portal_user_id" INTEGER NOT NULL,
  "window_started_at" TIMESTAMP(3) NOT NULL,
  "tracks_used" INTEGER NOT NULL DEFAULT 0,
  "packs_used" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "downloader_quota_states_pkey" PRIMARY KEY ("portal_user_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'downloader_quota_states_portal_user_id_fkey'
  ) THEN
    ALTER TABLE "downloader_quota_states"
      ADD CONSTRAINT "downloader_quota_states_portal_user_id_fkey"
      FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
