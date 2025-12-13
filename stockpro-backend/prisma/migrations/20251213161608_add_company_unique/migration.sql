/*
  Warnings:

  - A unique constraint covering the columns `[id,companyId]` on the table `AuditLog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Bank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `CurrentAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `ExpenseCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `ExpenseType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `FiscalYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `InternalTransfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `InventoryCount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `ItemGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `PayableAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `PaymentVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `PriceQuotation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `PurchaseInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `PurchaseReturn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `ReceiptVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `ReceivableAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `RevenueCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Safe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `SalesInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `SalesReturn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `StoreIssueVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `StoreReceiptVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,companyId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "AuditLog_id_companyId_idx" ON "AuditLog"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_id_companyId_key" ON "AuditLog"("id", "companyId");

-- CreateIndex
CREATE INDEX "Bank_id_companyId_idx" ON "Bank"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_id_companyId_key" ON "Bank"("id", "companyId");

-- CreateIndex
CREATE INDEX "Branch_id_companyId_idx" ON "Branch"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_id_companyId_key" ON "Branch"("id", "companyId");

-- CreateIndex
CREATE INDEX "CurrentAccount_id_companyId_idx" ON "CurrentAccount"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentAccount_id_companyId_key" ON "CurrentAccount"("id", "companyId");

-- CreateIndex
CREATE INDEX "Customer_id_companyId_idx" ON "Customer"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_companyId_key" ON "Customer"("id", "companyId");

-- CreateIndex
CREATE INDEX "Expense_id_companyId_idx" ON "Expense"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_id_companyId_key" ON "Expense"("id", "companyId");

-- CreateIndex
CREATE INDEX "ExpenseCode_id_companyId_idx" ON "ExpenseCode"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCode_id_companyId_key" ON "ExpenseCode"("id", "companyId");

-- CreateIndex
CREATE INDEX "ExpenseType_id_companyId_idx" ON "ExpenseType"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_id_companyId_key" ON "ExpenseType"("id", "companyId");

-- CreateIndex
CREATE INDEX "FiscalYear_id_companyId_idx" ON "FiscalYear"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_id_companyId_key" ON "FiscalYear"("id", "companyId");

-- CreateIndex
CREATE INDEX "InternalTransfer_id_companyId_idx" ON "InternalTransfer"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalTransfer_id_companyId_key" ON "InternalTransfer"("id", "companyId");

-- CreateIndex
CREATE INDEX "InventoryCount_id_companyId_idx" ON "InventoryCount"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCount_id_companyId_key" ON "InventoryCount"("id", "companyId");

-- CreateIndex
CREATE INDEX "Item_id_companyId_idx" ON "Item"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_id_companyId_key" ON "Item"("id", "companyId");

-- CreateIndex
CREATE INDEX "ItemGroup_id_companyId_idx" ON "ItemGroup"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroup_id_companyId_key" ON "ItemGroup"("id", "companyId");

-- CreateIndex
CREATE INDEX "Notification_id_companyId_idx" ON "Notification"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_id_companyId_key" ON "Notification"("id", "companyId");

-- CreateIndex
CREATE INDEX "PayableAccount_id_companyId_idx" ON "PayableAccount"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PayableAccount_id_companyId_key" ON "PayableAccount"("id", "companyId");

-- CreateIndex
CREATE INDEX "PaymentVoucher_id_companyId_idx" ON "PaymentVoucher"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVoucher_id_companyId_key" ON "PaymentVoucher"("id", "companyId");

-- CreateIndex
CREATE INDEX "Permission_id_companyId_idx" ON "Permission"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_id_companyId_key" ON "Permission"("id", "companyId");

-- CreateIndex
CREATE INDEX "PriceQuotation_id_companyId_idx" ON "PriceQuotation"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceQuotation_id_companyId_key" ON "PriceQuotation"("id", "companyId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_id_companyId_idx" ON "PurchaseInvoice"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_id_companyId_key" ON "PurchaseInvoice"("id", "companyId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_id_companyId_idx" ON "PurchaseReturn"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_id_companyId_key" ON "PurchaseReturn"("id", "companyId");

-- CreateIndex
CREATE INDEX "ReceiptVoucher_id_companyId_idx" ON "ReceiptVoucher"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptVoucher_id_companyId_key" ON "ReceiptVoucher"("id", "companyId");

-- CreateIndex
CREATE INDEX "ReceivableAccount_id_companyId_idx" ON "ReceivableAccount"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivableAccount_id_companyId_key" ON "ReceivableAccount"("id", "companyId");

-- CreateIndex
CREATE INDEX "RevenueCode_id_companyId_idx" ON "RevenueCode"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueCode_id_companyId_key" ON "RevenueCode"("id", "companyId");

-- CreateIndex
CREATE INDEX "Role_id_companyId_idx" ON "Role"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_id_companyId_key" ON "Role"("id", "companyId");

-- CreateIndex
CREATE INDEX "Safe_id_companyId_idx" ON "Safe"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Safe_id_companyId_key" ON "Safe"("id", "companyId");

-- CreateIndex
CREATE INDEX "SalesInvoice_id_companyId_idx" ON "SalesInvoice"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_id_companyId_key" ON "SalesInvoice"("id", "companyId");

-- CreateIndex
CREATE INDEX "SalesReturn_id_companyId_idx" ON "SalesReturn"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturn_id_companyId_key" ON "SalesReturn"("id", "companyId");

-- CreateIndex
CREATE INDEX "Store_id_companyId_idx" ON "Store"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_id_companyId_key" ON "Store"("id", "companyId");

-- CreateIndex
CREATE INDEX "StoreIssueVoucher_id_companyId_idx" ON "StoreIssueVoucher"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreIssueVoucher_id_companyId_key" ON "StoreIssueVoucher"("id", "companyId");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucher_id_companyId_idx" ON "StoreReceiptVoucher"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreReceiptVoucher_id_companyId_key" ON "StoreReceiptVoucher"("id", "companyId");

-- CreateIndex
CREATE INDEX "Supplier_id_companyId_idx" ON "Supplier"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_id_companyId_key" ON "Supplier"("id", "companyId");

-- CreateIndex
CREATE INDEX "Unit_id_companyId_idx" ON "Unit"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_id_companyId_key" ON "Unit"("id", "companyId");

-- CreateIndex
CREATE INDEX "User_id_companyId_idx" ON "User"("id", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_companyId_key" ON "User"("id", "companyId");
