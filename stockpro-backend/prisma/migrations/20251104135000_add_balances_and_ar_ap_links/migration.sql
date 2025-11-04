-- Add currentBalance to accounts
ALTER TABLE "CurrentAccount" ADD COLUMN "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ReceivableAccount" ADD COLUMN "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "PayableAccount" ADD COLUMN "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill currentBalance from openingBalance
UPDATE "CurrentAccount" SET "currentBalance" = COALESCE("openingBalance", 0);
UPDATE "ReceivableAccount" SET "currentBalance" = COALESCE("openingBalance", 0);
UPDATE "PayableAccount" SET "currentBalance" = COALESCE("openingBalance", 0);

-- Add AR/AP links to vouchers
ALTER TABLE "PaymentVoucher" ADD COLUMN "receivableAccountId" TEXT;
ALTER TABLE "PaymentVoucher" ADD COLUMN "payableAccountId" TEXT;

ALTER TABLE "ReceiptVoucher" ADD COLUMN "receivableAccountId" TEXT;
ALTER TABLE "ReceiptVoucher" ADD COLUMN "payableAccountId" TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS "PaymentVoucher_receivableAccountId_idx" ON "PaymentVoucher"("receivableAccountId");
CREATE INDEX IF NOT EXISTS "PaymentVoucher_payableAccountId_idx" ON "PaymentVoucher"("payableAccountId");
CREATE INDEX IF NOT EXISTS "ReceiptVoucher_receivableAccountId_idx" ON "ReceiptVoucher"("receivableAccountId");
CREATE INDEX IF NOT EXISTS "ReceiptVoucher_payableAccountId_idx" ON "ReceiptVoucher"("payableAccountId");

-- FKs
ALTER TABLE "PaymentVoucher"
  ADD CONSTRAINT "PaymentVoucher_receivableAccountId_fkey"
  FOREIGN KEY ("receivableAccountId") REFERENCES "ReceivableAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentVoucher"
  ADD CONSTRAINT "PaymentVoucher_payableAccountId_fkey"
  FOREIGN KEY ("payableAccountId") REFERENCES "PayableAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReceiptVoucher"
  ADD CONSTRAINT "ReceiptVoucher_receivableAccountId_fkey"
  FOREIGN KEY ("receivableAccountId") REFERENCES "ReceivableAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReceiptVoucher"
  ADD CONSTRAINT "ReceiptVoucher_payableAccountId_fkey"
  FOREIGN KEY ("payableAccountId") REFERENCES "PayableAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;


