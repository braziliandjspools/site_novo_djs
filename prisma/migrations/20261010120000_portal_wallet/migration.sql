ALTER TABLE "mercado_pago_orders"
  ADD COLUMN IF NOT EXISTS "wallet_applied_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  CREATE TYPE "PortalWalletTransactionType" AS ENUM ('TOP_UP', 'PURCHASE', 'REFUND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PortalWalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "portal_wallets" (
  "portal_user_id" INTEGER PRIMARY KEY,
  "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portal_wallets_portal_user_id_fkey"
    FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "portal_wallet_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "portal_user_id" INTEGER NOT NULL,
  "mercado_pago_order_id" UUID,
  "type" "PortalWalletTransactionType" NOT NULL,
  "status" "PortalWalletTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "amount" DECIMAL(10,2) NOT NULL,
  "description" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portal_wallet_transactions_portal_user_id_fkey"
    FOREIGN KEY ("portal_user_id") REFERENCES "portal_wallets"("portal_user_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "portal_wallet_transactions_amount_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "portal_wallet_transactions_order_type_key"
  ON "portal_wallet_transactions"("mercado_pago_order_id", "type");
CREATE INDEX IF NOT EXISTS "portal_wallet_transactions_user_created_idx"
  ON "portal_wallet_transactions"("portal_user_id", "created_at");

INSERT INTO "portal_wallets" ("portal_user_id", "balance")
SELECT "id", 0 FROM "portal_users"
ON CONFLICT ("portal_user_id") DO NOTHING;
