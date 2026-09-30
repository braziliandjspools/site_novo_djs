CREATE TABLE IF NOT EXISTS "brs_producers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "full_name" TEXT,
    "bio" TEXT,
    "photo_file_id" TEXT,
    "city" TEXT,
    "country" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,
    "soundcloud" TEXT,
    "spotify" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brs_producers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "brs_producers_slug_key" ON "brs_producers"("slug");

CREATE TABLE IF NOT EXISTS "brs_productions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "producer_id" TEXT,
    "version_type" TEXT NOT NULL,
    "version_label" TEXT,
    "category" TEXT NOT NULL DEFAULT 'BRS_ORIGINAL',
    "genre" TEXT,
    "duration" TEXT,
    "bpm" TEXT,
    "format" TEXT,
    "bitrate" TEXT,
    "cover_url" TEXT,
    "cover_file_id" TEXT,
    "audio_file_id" TEXT NOT NULL,
    "download_file_id" TEXT,
    "file_name" TEXT NOT NULL,
    "description" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brs_productions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "producer_id" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "version_label" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "genre" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "bpm" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "format" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "bitrate" TEXT;
ALTER TABLE "brs_productions" ADD COLUMN IF NOT EXISTS "cover_file_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "brs_productions_slug_key" ON "brs_productions"("slug");
CREATE INDEX IF NOT EXISTS "brs_productions_is_published_published_at_idx" ON "brs_productions"("is_published", "published_at");
CREATE INDEX IF NOT EXISTS "brs_productions_producer_id_published_at_idx" ON "brs_productions"("producer_id", "published_at");

DO $$
BEGIN
    ALTER TABLE "brs_productions"
        ADD CONSTRAINT "brs_productions_producer_id_fkey"
        FOREIGN KEY ("producer_id") REFERENCES "brs_producers"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
