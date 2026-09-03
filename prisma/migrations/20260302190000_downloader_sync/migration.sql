-- AlterTable
ALTER TABLE "download_jobs" ADD COLUMN "target_device_id" TEXT;
ALTER TABLE "download_jobs" ADD COLUMN "dismissed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "download_jobs_portal_user_id_file_id_idx" ON "download_jobs"("portal_user_id", "file_id");
CREATE INDEX "download_jobs_portal_user_id_dismissed_at_idx" ON "download_jobs"("portal_user_id", "dismissed_at");
