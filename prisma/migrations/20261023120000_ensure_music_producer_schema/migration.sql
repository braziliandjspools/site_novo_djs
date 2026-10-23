-- Keep the schema used by the client productions API up to date on existing databases.
DO $$ BEGIN
  CREATE TYPE "MusicProducerBriefingStatus" AS ENUM ('PENDENTE', 'EM_REVISAO', 'EM_PRODUCAO', 'EM_EDICAO', 'CONCLUIDO', 'EXCLUIDO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "music_producer_briefings"
  ADD COLUMN IF NOT EXISTS "status" "MusicProducerBriefingStatus" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN IF NOT EXISTS "admin_note" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "music_producer_briefings_status_created_at_idx"
  ON "music_producer_briefings"("status", "created_at");

ALTER TABLE "music_producer_deliveries"
  ADD COLUMN IF NOT EXISTS "beatport_url" TEXT;
