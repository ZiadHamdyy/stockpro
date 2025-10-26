-- AlterTable
ALTER TABLE "PaymentVoucher" DROP COLUMN IF EXISTS "safeOrBankId";

-- AlterTable
ALTER TABLE "PaymentVoucher" ADD COLUMN IF NOT EXISTS "safeId" TEXT,
ADD COLUMN IF NOT EXISTS "bankId" TEXT;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

