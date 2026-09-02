-- CreateEnum
CREATE TYPE "PortalPlan" AS ENUM ('NONE', 'VIP', 'DEEMIX', 'ALLAVSOFT');

-- CreateEnum
CREATE TYPE "DownloadJobProvider" AS ENUM ('GOOGLE_DRIVE');

-- CreateEnum
CREATE TYPE "DownloadJobStatus" AS ENUM ('PENDING', 'RECEIVED', 'DOWNLOADING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MusicProducerRedoReason" AS ENUM ('AI', 'PRODUCER', 'BOTH');

-- CreateTable
CREATE TABLE "portal_users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "plan" "PortalPlan" NOT NULL,
    "due_day" INTEGER NOT NULL,
    "next_due_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "music_producer_deliveries_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "music_producer_deliveries" (
    "id" SERIAL NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "service_plan" TEXT,
    "charged_amount" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "download_url" TEXT NOT NULL,
    "notes" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "client_rating" INTEGER,
    "client_review" TEXT,
    "redo_requested" BOOLEAN NOT NULL DEFAULT false,
    "redo_reason" "MusicProducerRedoReason",
    "redo_notes" TEXT,
    "redo_requested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_producer_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_producer_briefings" (
    "id" SERIAL NOT NULL,
    "portal_user_id" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "service_plan" TEXT NOT NULL,
    "estimated_quote" TEXT,
    "idea" TEXT NOT NULL,
    "lyrics" TEXT,
    "style" TEXT,
    "occasion" TEXT,
    "deadline" TEXT,
    "deadline_surcharge" TEXT,
    "additional_notes" TEXT,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "music_producer_briefings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_email_key" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_users_next_due_at_idx" ON "portal_users"("next_due_at");

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

-- CreateIndex
CREATE INDEX "music_producer_deliveries_portal_user_id_order_date_idx" ON "music_producer_deliveries"("portal_user_id", "order_date");

-- CreateIndex
CREATE INDEX "music_producer_briefings_portal_user_id_created_at_idx" ON "music_producer_briefings"("portal_user_id", "created_at");

-- CreateIndex
CREATE INDEX "music_producer_briefings_created_at_idx" ON "music_producer_briefings"("created_at");

-- AddForeignKey
ALTER TABLE "download_devices" ADD CONSTRAINT "download_devices_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_jobs" ADD CONSTRAINT "download_jobs_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_jobs" ADD CONSTRAINT "download_jobs_download_device_id_fkey" FOREIGN KEY ("download_device_id") REFERENCES "download_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_producer_deliveries" ADD CONSTRAINT "music_producer_deliveries_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_producer_briefings" ADD CONSTRAINT "music_producer_briefings_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

