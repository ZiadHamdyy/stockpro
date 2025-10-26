-- DropColumn
ALTER TABLE "PaymentVoucher" DROP COLUMN IF EXISTS "entityId";

-- AlterTable
ALTER TABLE "PaymentVoucher" ADD COLUMN IF NOT EXISTS "customerId" TEXT,
ADD COLUMN IF NOT EXISTS "supplierId" TEXT,
ADD COLUMN IF NOT EXISTS "currentAccountId" TEXT,
ADD COLUMN IF NOT EXISTS "expenseCodeId" TEXT;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_currentAccountId_fkey" FOREIGN KEY ("currentAccountId") REFERENCES "CurrentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_expenseCodeId_fkey" FOREIGN KEY ("expenseCodeId") REFERENCES "ExpenseCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
