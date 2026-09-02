-- CreateEnum
CREATE TYPE "DownloadJobProvider" AS ENUM ('GOOGLE_DRIVE');

-- CreateEnum
CREATE TYPE "DownloadJobStatus" AS ENUM ('PENDING', 'RECEIVED', 'DOWNLOADING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "download_devices" (
    "id" SERIAL NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "download_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_jobs" (
    "id" SERIAL NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "download_device_id" INTEGER,
    "provider" "DownloadJobProvider" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "file_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "relative_path" TEXT,
    "file_size" BIGINT,
    "mime_type" TEXT,
    "status" "DownloadJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "downloaded_bytes" BIGINT NOT NULL DEFAULT 0,
    "total_bytes" BIGINT,
    "error" TEXT,
    "claimed_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "download_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "download_devices_portal_user_id_idx" ON "download_devices"("portal_user_id");

-- CreateIndex
CREATE INDEX "download_devices_last_seen_at_idx" ON "download_devices"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "download_devices_portal_user_id_device_id_key" ON "download_devices"("portal_user_id", "device_id");

-- CreateIndex
CREATE INDEX "download_jobs_portal_user_id_status_idx" ON "download_jobs"("portal_user_id", "status");

-- CreateIndex
CREATE INDEX "download_jobs_download_device_id_status_idx" ON "download_jobs"("download_device_id", "status");

-- CreateIndex
CREATE INDEX "download_jobs_status_created_at_idx" ON "download_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "download_jobs_portal_user_id_created_at_idx" ON "download_jobs"("portal_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "download_devices" ADD CONSTRAINT "download_devices_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_jobs" ADD CONSTRAINT "download_jobs_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_jobs" ADD CONSTRAINT "download_jobs_download_device_id_fkey" FOREIGN KEY ("download_device_id") REFERENCES "download_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
