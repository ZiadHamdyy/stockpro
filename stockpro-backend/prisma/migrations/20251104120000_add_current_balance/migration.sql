-- Add currentBalance columns
ALTER TABLE "Bank" ADD COLUMN IF NOT EXISTS "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Safe" ADD COLUMN IF NOT EXISTS "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill balances for Bank
UPDATE "Bank" b SET "currentBalance" = COALESCE(b."openingBalance",0)
  + COALESCE((SELECT SUM(rv.amount) FROM "ReceiptVoucher" rv WHERE rv."paymentMethod"='bank' AND rv."bankId"=b.id),0)
  - COALESCE((SELECT SUM(pv.amount) FROM "PaymentVoucher" pv WHERE pv."paymentMethod"='bank' AND pv."bankId"=b.id),0)
  - COALESCE((SELECT SUM(it.amount) FROM "InternalTransfer" it WHERE it."fromType"='bank' AND it."fromBankId"=b.id),0)
  + COALESCE((SELECT SUM(it.amount) FROM "InternalTransfer" it WHERE it."toType"='bank' AND it."toBankId"=b.id),0);

-- Backfill balances for Safe
UPDATE "Safe" s SET "currentBalance" = COALESCE(s."openingBalance",0)
  + COALESCE((SELECT SUM(rv.amount) FROM "ReceiptVoucher" rv WHERE rv."paymentMethod"='safe' AND rv."safeId"=s.id),0)
  - COALESCE((SELECT SUM(pv.amount) FROM "PaymentVoucher" pv WHERE pv."paymentMethod"='safe' AND pv."safeId"=s.id),0)
  - COALESCE((SELECT SUM(it.amount) FROM "InternalTransfer" it WHERE it."fromType"='safe' AND it."fromSafeId"=s.id),0)
  + COALESCE((SELECT SUM(it.amount) FROM "InternalTransfer" it WHERE it."toType"='safe' AND it."toSafeId"=s.id),0);


