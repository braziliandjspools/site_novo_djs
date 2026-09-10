-- CreateEnum
CREATE TYPE "MercadoPagoOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateTable (não destrutiva: apenas cria objetos novos)
CREATE TABLE "mercado_pago_orders" (
    "id" UUID NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "plan_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "MercadoPagoOrderStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "external_reference" TEXT NOT NULL,
    "mercado_pago_preference_id" TEXT,
    "mercado_pago_payment_id" TEXT,
    "payer_email" TEXT,
    "raw_status" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mercado_pago_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mercado_pago_orders_external_reference_key" ON "mercado_pago_orders"("external_reference");

-- CreateIndex
CREATE UNIQUE INDEX "mercado_pago_orders_mercado_pago_payment_id_key" ON "mercado_pago_orders"("mercado_pago_payment_id");

-- CreateIndex
CREATE INDEX "mercado_pago_orders_portal_user_id_status_idx" ON "mercado_pago_orders"("portal_user_id", "status");

-- CreateIndex
CREATE INDEX "mercado_pago_orders_mercado_pago_preference_id_idx" ON "mercado_pago_orders"("mercado_pago_preference_id");

-- AddForeignKey
ALTER TABLE "mercado_pago_orders" ADD CONSTRAINT "mercado_pago_orders_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
