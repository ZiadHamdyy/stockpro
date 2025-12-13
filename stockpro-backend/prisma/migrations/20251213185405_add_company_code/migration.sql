/*
  Warnings:

  - A unique constraint covering the columns `[code,companyId]` on the table `ItemGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ItemGroup_code_key";

-- DropIndex
DROP INDEX "public"."Unit_code_key";

-- DropIndex
DROP INDEX "public"."User_code_key";

-- AlterTable
ALTER TABLE "ItemGroup" ALTER COLUMN "code" DROP DEFAULT;
DROP SEQUENCE "ItemGroup_code_seq";

-- AlterTable
ALTER TABLE "Unit" ALTER COLUMN "code" DROP DEFAULT;
DROP SEQUENCE "Unit_code_seq";

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroup_code_companyId_key" ON "ItemGroup"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_companyId_key" ON "Unit"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_code_companyId_key" ON "User"("code", "companyId");
