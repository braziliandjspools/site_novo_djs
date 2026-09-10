-- Coluna de idempotência do e-mail de ativação (só aplica se a tabela já existir).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'mercado_pago_orders'
  ) THEN
    ALTER TABLE "mercado_pago_orders"
      ADD COLUMN IF NOT EXISTS "activation_email_sent_at" TIMESTAMP(3);
  END IF;
END $$;
