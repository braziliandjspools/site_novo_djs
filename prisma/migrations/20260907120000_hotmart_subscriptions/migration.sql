-- CreateEnum
CREATE TYPE "HotmartSubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'REFUNDED', 'CHARGEBACK', 'PAST_DUE');

-- CreateTable
CREATE TABLE "hotmart_subscriptions" (
    "id" TEXT NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "HotmartSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" TEXT NOT NULL DEFAULT 'hotmart',
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "provider_product_id" TEXT,
    "provider_offer_id" TEXT,
    "provider_transaction_id" TEXT,
    "started_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "last_payment_at" TIMESTAMP(3),
    "access_revoked_at" TIMESTAMP(3),
    "activation_email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotmart_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "transaction_id" TEXT,
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotmart_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_pending_purchases" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "buyer_name" TEXT,
    "plan_id" TEXT NOT NULL,
    "provider_transaction_id" TEXT NOT NULL,
    "provider_subscription_id" TEXT,
    "provider_product_id" TEXT,
    "provider_offer_id" TEXT,
    "current_period_end" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotmart_pending_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_subscriptions_provider_subscription_id_key" ON "hotmart_subscriptions"("provider_subscription_id");

-- CreateIndex
CREATE INDEX "hotmart_subscriptions_portal_user_id_status_idx" ON "hotmart_subscriptions"("portal_user_id", "status");

-- CreateIndex
CREATE INDEX "hotmart_subscriptions_provider_transaction_id_idx" ON "hotmart_subscriptions"("provider_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_webhook_events_event_id_key" ON "hotmart_webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "hotmart_webhook_events_transaction_id_idx" ON "hotmart_webhook_events"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_pending_purchases_provider_transaction_id_key" ON "hotmart_pending_purchases"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "hotmart_pending_purchases_email_claimed_at_idx" ON "hotmart_pending_purchases"("email", "claimed_at");

-- AddForeignKey
ALTER TABLE "hotmart_subscriptions" ADD CONSTRAINT "hotmart_subscriptions_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
