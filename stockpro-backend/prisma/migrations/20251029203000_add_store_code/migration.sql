-- Add code column as nullable first
ALTER TABLE "Store" ADD COLUMN "code" integer;

-- Backfill codes sequentially based on creation time
WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "Store"
)
UPDATE "Store" s
SET "code" = n.rn
FROM numbered n
WHERE s."id" = n."id";

-- Enforce NOT NULL constraint
ALTER TABLE "Store" ALTER COLUMN "code" SET NOT NULL;

-- Add unique index on code
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");


