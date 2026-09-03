-- AlterTable
ALTER TABLE "portal_users" ADD COLUMN "service_pools_vip" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portal_users" ADD COLUMN "service_deemix" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portal_users" ADD COLUMN "service_allavsoft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portal_users" ADD COLUMN "monthly_value" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Migrate legacy single-plan field into independent service flags
UPDATE "portal_users" SET "service_pools_vip" = true WHERE "plan" = 'VIP';
UPDATE "portal_users" SET "service_deemix" = true WHERE "plan" = 'DEEMIX';
UPDATE "portal_users" SET "service_allavsoft" = true WHERE "plan" = 'ALLAVSOFT';
