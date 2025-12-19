-- CreateEnum
CREATE TYPE "ZatcaStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN     "zatcaHash" TEXT,
ADD COLUMN     "zatcaIssueDateTime" TIMESTAMP(3),
ADD COLUMN     "zatcaPreviousHash" TEXT,
ADD COLUMN     "zatcaResponseMessage" TEXT,
ADD COLUMN     "zatcaResponseXml" TEXT,
ADD COLUMN     "zatcaSequentialNumber" INTEGER,
ADD COLUMN     "zatcaStatus" "ZatcaStatus",
ADD COLUMN     "zatcaSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "zatcaUuid" TEXT;
