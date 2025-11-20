-- AlterTable
ALTER TABLE "PurchaseInvoice" ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "safeId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseReturn" ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "safeId" TEXT;

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "safeId" TEXT;

-- AlterTable
ALTER TABLE "SalesReturn" ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "safeId" TEXT;

-- CreateIndex
CREATE INDEX "PurchaseInvoice_safeId_idx" ON "PurchaseInvoice"("safeId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_bankId_idx" ON "PurchaseInvoice"("bankId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_safeId_idx" ON "PurchaseReturn"("safeId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_bankId_idx" ON "PurchaseReturn"("bankId");

-- CreateIndex
CREATE INDEX "SalesInvoice_safeId_idx" ON "SalesInvoice"("safeId");

-- CreateIndex
CREATE INDEX "SalesInvoice_bankId_idx" ON "SalesInvoice"("bankId");

-- CreateIndex
CREATE INDEX "SalesReturn_safeId_idx" ON "SalesReturn"("safeId");

-- CreateIndex
CREATE INDEX "SalesReturn_bankId_idx" ON "SalesReturn"("bankId");

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_safeId_fkey" FOREIGN KEY ("safeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
