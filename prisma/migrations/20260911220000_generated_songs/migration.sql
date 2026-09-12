-- BRS Flow Studio: músicas geradas + usage
CREATE TYPE "GeneratedSongStatus" AS ENUM ('QUEUED', 'GENERATING', 'COMPLETED', 'FAILED');

CREATE TABLE "generated_songs" (
    "id" TEXT NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "song_group_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "style" TEXT,
    "mood" TEXT,
    "voice" TEXT,
    "language" TEXT DEFAULT 'pt-BR',
    "bpm" INTEGER,
    "instrumental" BOOLEAN NOT NULL DEFAULT false,
    "prompt" TEXT NOT NULL,
    "lyrics" TEXT,
    "model_prompt" TEXT,
    "status" "GeneratedSongStatus" NOT NULL DEFAULT 'QUEUED',
    "error_message" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'openrouter',
    "model" TEXT NOT NULL,
    "generation_id" TEXT,
    "idempotency_key" TEXT,
    "audio_url" TEXT,
    "audio_storage_key" TEXT,
    "audio_base64" TEXT,
    "audio_mime_type" TEXT,
    "artwork_url" TEXT,
    "duration_seconds" DOUBLE PRECISION,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_songs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "generated_songs_idempotency_key_key" ON "generated_songs"("idempotency_key");
CREATE UNIQUE INDEX "generated_songs_song_group_id_version_number_key" ON "generated_songs"("song_group_id", "version_number");
CREATE INDEX "generated_songs_portal_user_id_created_at_idx" ON "generated_songs"("portal_user_id", "created_at");
CREATE INDEX "generated_songs_portal_user_id_favorite_idx" ON "generated_songs"("portal_user_id", "favorite");
CREATE INDEX "generated_songs_song_group_id_idx" ON "generated_songs"("song_group_id");
CREATE INDEX "generated_songs_status_created_at_idx" ON "generated_songs"("status", "created_at");

ALTER TABLE "generated_songs" ADD CONSTRAINT "generated_songs_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "music_generation_usages" (
    "id" TEXT NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "song_id" TEXT,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "estimated_cost" DECIMAL(10,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "music_generation_usages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "music_generation_usages_portal_user_id_created_at_idx" ON "music_generation_usages"("portal_user_id", "created_at");
CREATE INDEX "music_generation_usages_song_id_idx" ON "music_generation_usages"("song_id");

ALTER TABLE "music_generation_usages" ADD CONSTRAINT "music_generation_usages_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "music_generation_usages" ADD CONSTRAINT "music_generation_usages_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "generated_songs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
