/*
  Warnings:

  - You are about to drop the column `logoPath` on the `Company` table. All the data in the column will be lost.
  - The `image` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "logoPath",
ADD COLUMN     "logo" BYTEA;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "image" BYTEA;
