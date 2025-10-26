-- CreateTable
CREATE TABLE "PaymentVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "safeId" TEXT,
    "bankId" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "currentAccountId" TEXT,
    "expenseCodeId" TEXT,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptVoucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "safeId" TEXT,
    "bankId" TEXT,
    "customerId" TEXT,
    "supplierId" TEXT,
    "currentAccountId" TEXT,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVoucher_code_key" ON "PaymentVoucher"("code");

-- CreateIndex
CREATE INDEX "PaymentVoucher_code_idx" ON "PaymentVoucher"("code");

-- CreateIndex
CREATE INDEX "PaymentVoucher_date_idx" ON "PaymentVoucher"("date");

-- CreateIndex
CREATE INDEX "PaymentVoucher_entityType_idx" ON "PaymentVoucher"("entityType");

-- CreateIndex
CREATE INDEX "PaymentVoucher_userId_idx" ON "PaymentVoucher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptVoucher_code_key" ON "ReceiptVoucher"("code");

-- CreateIndex
CREATE INDEX "ReceiptVoucher_code_idx" ON "ReceiptVoucher"("code");

-- CreateIndex
CREATE INDEX "ReceiptVoucher_date_idx" ON "ReceiptVoucher"("date");

-- CreateIndex
CREATE INDEX "ReceiptVoucher_entityType_idx" ON "ReceiptVoucher"("entityType");

-- CreateIndex
CREATE INDEX "ReceiptVoucher_userId_idx" ON "ReceiptVoucher"("userId");

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_currentAccountId_fkey" FOREIGN KEY ("currentAccountId") REFERENCES "CurrentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_expenseCodeId_fkey" FOREIGN KEY ("expenseCodeId") REFERENCES "ExpenseCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_currentAccountId_fkey" FOREIGN KEY ("currentAccountId") REFERENCES "CurrentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
