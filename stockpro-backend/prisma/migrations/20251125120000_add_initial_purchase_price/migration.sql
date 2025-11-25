-- Add initialPurchasePrice column to Item and backfill existing rows
ALTER TABLE "Item"
ADD COLUMN "initialPurchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "Item"
SET "initialPurchasePrice" = COALESCE("purchasePrice", 0);

