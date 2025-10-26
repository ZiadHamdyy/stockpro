/*
  Warnings:

  - Added the required column `branchId` to the `User` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the column as nullable
ALTER TABLE "User" ADD COLUMN "branchId" TEXT;

-- Get the first branch ID to assign to existing users
-- We'll create a default branch if none exists
INSERT INTO "Branch" ("id", "name", "address", "phone", "description", "createdAt", "updatedAt")
SELECT 'default-branch-id', 'Default Branch', 'Default Address', 'Default Phone', 'Default branch for existing users', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Branch" LIMIT 1);

-- Update existing users to have the first available branch
UPDATE "User" 
SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1)
WHERE "branchId" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "User" ALTER COLUMN "branchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
