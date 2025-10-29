-- Add code column as nullable first
ALTER TABLE "User" ADD COLUMN "code" integer;

-- Backfill codes sequentially based on creation time
WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "User"
)
UPDATE "User" u
SET "code" = n.rn
FROM numbered n
WHERE u."id" = n."id";

-- Enforce NOT NULL constraint
ALTER TABLE "User" ALTER COLUMN "code" SET NOT NULL;

-- Add unique index on code
CREATE UNIQUE INDEX "User_code_key" ON "User"("code");


