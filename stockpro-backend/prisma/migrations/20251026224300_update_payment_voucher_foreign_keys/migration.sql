-- AlterTable
ALTER TABLE "PaymentVoucher" DROP COLUMN IF EXISTS "safeOrBankId";

-- AlterTable
ALTER TABLE "PaymentVoucher" ADD COLUMN IF NOT EXISTS "safeId" TEXT,
ADD COLUMN IF NOT EXISTS "bankId" TEXT;

-- AddForeignKey (only if constraint doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PaymentVoucher_safeId_fkey'
    ) THEN
        ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (only if constraint doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PaymentVoucher_bankId_fkey'
    ) THEN
        ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

