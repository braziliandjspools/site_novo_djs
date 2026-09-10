-- AlterTable
CREATE TYPE "MusicProducerBriefingStatus" AS ENUM ('PENDENTE', 'EM_REVISAO', 'EM_PRODUCAO', 'EM_EDICAO', 'CONCLUIDO', 'EXCLUIDO');

ALTER TABLE "music_producer_briefings"
  ADD COLUMN "status" "MusicProducerBriefingStatus" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "admin_note" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "music_producer_briefings_status_created_at_idx" ON "music_producer_briefings"("status", "created_at");
