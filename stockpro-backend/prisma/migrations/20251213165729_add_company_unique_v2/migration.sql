/*
  Warnings:

  - A unique constraint covering the columns `[id,companyId]` on the table `StoreTransferVoucher` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "StoreTransferVoucher_id_companyId_idx" ON "StoreTransferVoucher"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransferVoucher_id_companyId_key" ON "StoreTransferVoucher"("id", "companyId");
