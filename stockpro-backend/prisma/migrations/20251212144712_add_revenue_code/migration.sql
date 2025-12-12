-- CreateTable
CREATE TABLE "RevenueCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueCode_code_key" ON "RevenueCode"("code");

-- CreateIndex
CREATE INDEX "RevenueCode_code_idx" ON "RevenueCode"("code");

-- AlterTable
ALTER TABLE "PaymentVoucher" ADD COLUMN "revenueCodeId" TEXT;

-- AlterTable
ALTER TABLE "ReceiptVoucher" ADD COLUMN "revenueCodeId" TEXT;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_revenueCodeId_fkey" FOREIGN KEY ("revenueCodeId") REFERENCES "RevenueCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_revenueCodeId_fkey" FOREIGN KEY ("revenueCodeId") REFERENCES "RevenueCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
