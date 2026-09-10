-- Valor e vencimento individuais por serviço no portal.
ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "service_pools_vip_value" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "service_pools_vip_due_at" TIMESTAMP(3);
ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "service_deemix_value" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "service_deemix_due_at" TIMESTAMP(3);
ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "service_allavsoft_value" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "portal_users" ADD COLUMN IF NOT EXISTS "service_allavsoft_due_at" TIMESTAMP(3);

-- Backfill: atribui o valor/vencimento agregados ao serviço ativo principal.
UPDATE "portal_users"
SET
  "service_pools_vip_value" = CASE WHEN "service_pools_vip" THEN "monthly_value" ELSE 0 END,
  "service_pools_vip_due_at" = CASE WHEN "service_pools_vip" THEN "next_due_at" ELSE NULL END,
  "service_deemix_value" = CASE
    WHEN "service_deemix" AND NOT "service_pools_vip" THEN "monthly_value"
    WHEN "service_deemix" THEN 0
    ELSE 0
  END,
  "service_deemix_due_at" = CASE WHEN "service_deemix" THEN "next_due_at" ELSE NULL END,
  "service_allavsoft_value" = CASE
    WHEN "service_allavsoft" AND NOT "service_pools_vip" AND NOT "service_deemix" THEN "monthly_value"
    WHEN "service_allavsoft" THEN 0
    ELSE 0
  END,
  "service_allavsoft_due_at" = NULL
WHERE
  "service_pools_vip_value" = 0
  AND "service_deemix_value" = 0
  AND "service_allavsoft_value" = 0
  AND ("service_pools_vip_due_at" IS NULL)
  AND ("service_deemix_due_at" IS NULL);

CREATE INDEX IF NOT EXISTS "portal_users_service_pools_vip_due_at_idx" ON "portal_users"("service_pools_vip_due_at");
CREATE INDEX IF NOT EXISTS "portal_users_service_deemix_due_at_idx" ON "portal_users"("service_deemix_due_at");
