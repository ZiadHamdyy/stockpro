-- Add code column as nullable first
ALTER TABLE "Branch" ADD COLUMN "code" integer;

-- Backfill codes sequentially based on creation time
WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "Branch"
)
UPDATE "Branch" b
SET "code" = n.rn
FROM numbered n
WHERE b."id" = n."id";

-- Enforce NOT NULL constraint
ALTER TABLE "Branch" ALTER COLUMN "code" SET NOT NULL;

-- Add unique index on code
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");


