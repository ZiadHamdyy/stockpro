/*
  Warnings:

  - Added the required column `branchId` to the `User` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the column as nullable
ALTER TABLE "User" ADD COLUMN "branchId" TEXT;

-- Update existing users to have the first available branch
UPDATE "User" 
SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1)
WHERE "branchId" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "User" ALTER COLUMN "branchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
