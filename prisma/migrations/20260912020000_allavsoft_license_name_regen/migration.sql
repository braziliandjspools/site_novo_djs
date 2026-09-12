-- Nome regenerável + suporte Allavsoft

ALTER TABLE "allavsoft_license_assignments"
ADD COLUMN "license_name_regen_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "allavsoft_license_assignments"
ADD COLUMN "support_notified_at" TIMESTAMP(3);
