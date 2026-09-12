-- Allavsoft: pool de seriais + atribuições de licença (uso único)

CREATE TABLE "allavsoft_key_pool" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allavsoft_key_pool_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "allavsoft_key_pool_serial_key" ON "allavsoft_key_pool"("serial");

CREATE TABLE "allavsoft_license_assignments" (
    "id" TEXT NOT NULL,
    "portal_user_id" INTEGER NOT NULL,
    "key_id" TEXT NOT NULL,
    "license_name" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "copied_at" TIMESTAMP(3),

    CONSTRAINT "allavsoft_license_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "allavsoft_license_assignments_key_id_key" ON "allavsoft_license_assignments"("key_id");
CREATE INDEX "allavsoft_license_assignments_portal_user_id_issued_at_idx" ON "allavsoft_license_assignments"("portal_user_id", "issued_at");

ALTER TABLE "allavsoft_license_assignments" ADD CONSTRAINT "allavsoft_license_assignments_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allavsoft_license_assignments" ADD CONSTRAINT "allavsoft_license_assignments_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "allavsoft_key_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed inicial de 10 seriais
INSERT INTO "allavsoft_key_pool" ("id", "serial", "created_at") VALUES
  ('cmallavsoftseed00000000001', 'CD14-7158-4E06-9F7A-3CE1-CAD0-4DA2-C630', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000002', '9F90-010C-7BE3-6642-82B7-2FF9-F36B-53E5', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000003', '7F38-0FD4-A8B7-FCB1-0FF5-D602-9058-5CF8', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000004', 'BB71-01A6-CFB3-6508-54DC-662E-7520-25AD', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000005', '7DB0-2DB7-5A1D-A7CF-4305-0617-F6D1-697F', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000006', 'B2D8-605A-BB98-14F6-1104-608B-FB23-E1A4', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000007', '58C4-8C55-8D68-7F83-E650-ED2D-CBFB-8F9A', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000008', 'E7DF-A553-41E3-05F7-A9B8-33B5-73DF-6D31', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000009', '9C06-9636-18D6-5982-2A5E-30DA-D447-718A', CURRENT_TIMESTAMP),
  ('cmallavsoftseed00000000010', '38AA-829F-4E49-8950-3385-26CA-9E33-B00A', CURRENT_TIMESTAMP)
ON CONFLICT ("serial") DO NOTHING;
