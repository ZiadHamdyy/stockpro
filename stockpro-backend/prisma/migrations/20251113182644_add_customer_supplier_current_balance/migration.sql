-- Add currentBalance columns to Customer and Supplier
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill currentBalance from openingBalance
UPDATE "Customer" SET "currentBalance" = COALESCE("openingBalance", 0);
UPDATE "Supplier" SET "currentBalance" = COALESCE("openingBalance", 0);

