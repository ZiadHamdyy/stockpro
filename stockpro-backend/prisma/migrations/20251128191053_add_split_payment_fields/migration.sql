-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('POS', 'TRANSFER');

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN "bankTransactionType" "BankTransactionType",
ADD COLUMN "isSplitPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "splitCashAmount" DOUBLE PRECISION,
ADD COLUMN "splitBankAmount" DOUBLE PRECISION,
ADD COLUMN "splitSafeId" TEXT,
ADD COLUMN "splitBankId" TEXT;

