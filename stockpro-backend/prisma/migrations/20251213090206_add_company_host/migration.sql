/*
  Warnings:

  - A unique constraint covering the columns `[code,companyId]` on the table `Bank` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[host]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `CurrentAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `ExpenseCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `ExpenseType` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `FiscalYear` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `InternalTransfer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `InventoryCount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `ItemGroup` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `PayableAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `PaymentVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resource,action,companyId]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `PriceQuotation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `PurchaseInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `PurchaseReturn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `ReceiptVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `ReceivableAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `RevenueCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Safe` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `SalesInvoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `SalesReturn` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voucherNumber,companyId]` on the table `StoreIssueVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voucherNumber,companyId]` on the table `StoreReceiptVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voucherNumber,companyId]` on the table `StoreTransferVoucher` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,companyId]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Bank` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `host` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `CurrentAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `ExpenseCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `ExpenseType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `FiscalYear` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `InternalTransfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `InventoryCount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `ItemGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `PayableAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `PaymentVoucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `PriceQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `PurchaseReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `ReceiptVoucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `ReceivableAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `RevenueCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Safe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `SalesInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `SalesReturn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `StoreIssueVoucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `StoreReceiptVoucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `StoreTransferVoucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Bank_code_key";

-- DropIndex
DROP INDEX "public"."Branch_code_key";

-- DropIndex
DROP INDEX "public"."CurrentAccount_code_key";

-- DropIndex
DROP INDEX "public"."Customer_code_key";

-- DropIndex
DROP INDEX "public"."Expense_code_key";

-- DropIndex
DROP INDEX "public"."ExpenseCode_code_key";

-- DropIndex
DROP INDEX "public"."ExpenseType_name_key";

-- DropIndex
DROP INDEX "public"."FiscalYear_name_key";

-- DropIndex
DROP INDEX "public"."InternalTransfer_code_key";

-- DropIndex
DROP INDEX "public"."InventoryCount_code_key";

-- DropIndex
DROP INDEX "public"."Item_code_key";

-- DropIndex
DROP INDEX "public"."ItemGroup_name_key";

-- DropIndex
DROP INDEX "public"."PayableAccount_code_key";

-- DropIndex
DROP INDEX "public"."PaymentVoucher_code_key";

-- DropIndex
DROP INDEX "public"."Permission_resource_action_key";

-- DropIndex
DROP INDEX "public"."PriceQuotation_code_key";

-- DropIndex
DROP INDEX "public"."PurchaseInvoice_code_key";

-- DropIndex
DROP INDEX "public"."PurchaseReturn_code_key";

-- DropIndex
DROP INDEX "public"."ReceiptVoucher_code_key";

-- DropIndex
DROP INDEX "public"."ReceivableAccount_code_key";

-- DropIndex
DROP INDEX "public"."RevenueCode_code_key";

-- DropIndex
DROP INDEX "public"."Role_name_key";

-- DropIndex
DROP INDEX "public"."Safe_code_key";

-- DropIndex
DROP INDEX "public"."SalesInvoice_code_key";

-- DropIndex
DROP INDEX "public"."SalesReturn_code_key";

-- DropIndex
DROP INDEX "public"."Store_code_key";

-- DropIndex
DROP INDEX "public"."StoreIssueVoucher_voucherNumber_key";

-- DropIndex
DROP INDEX "public"."StoreReceiptVoucher_voucherNumber_key";

-- DropIndex
DROP INDEX "public"."StoreTransferVoucher_voucherNumber_key";

-- DropIndex
DROP INDEX "public"."Supplier_code_key";

-- DropIndex
DROP INDEX "public"."Unit_name_key";

-- DropIndex
DROP INDEX "public"."User_email_key";

-- AlterTable
ALTER TABLE "Bank" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "host" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CurrentAccount" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExpenseCode" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExpenseType" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FiscalYear" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InternalTransfer" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryCount" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ItemGroup" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PayableAccount" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PaymentVoucher" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PriceQuotation" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseInvoice" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseReturn" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ReceiptVoucher" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ReceivableAccount" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RevenueCode" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Safe" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SalesReturn" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StoreIssueVoucher" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StoreReceiptVoucher" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StoreTransferVoucher" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Bank_companyId_idx" ON "Bank"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_code_companyId_key" ON "Bank"("code", "companyId");

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_companyId_key" ON "Branch"("code", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_host_key" ON "Company"("host");

-- CreateIndex
CREATE INDEX "Company_host_idx" ON "Company"("host");

-- CreateIndex
CREATE INDEX "CurrentAccount_companyId_idx" ON "CurrentAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentAccount_code_companyId_key" ON "CurrentAccount"("code", "companyId");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_companyId_key" ON "Customer"("code", "companyId");

-- CreateIndex
CREATE INDEX "Expense_companyId_idx" ON "Expense"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_code_companyId_key" ON "Expense"("code", "companyId");

-- CreateIndex
CREATE INDEX "ExpenseCode_companyId_idx" ON "ExpenseCode"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCode_code_companyId_key" ON "ExpenseCode"("code", "companyId");

-- CreateIndex
CREATE INDEX "ExpenseType_companyId_idx" ON "ExpenseType"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseType_name_companyId_key" ON "ExpenseType"("name", "companyId");

-- CreateIndex
CREATE INDEX "FiscalYear_companyId_idx" ON "FiscalYear"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_name_companyId_key" ON "FiscalYear"("name", "companyId");

-- CreateIndex
CREATE INDEX "InternalTransfer_companyId_idx" ON "InternalTransfer"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalTransfer_code_companyId_key" ON "InternalTransfer"("code", "companyId");

-- CreateIndex
CREATE INDEX "InventoryCount_companyId_idx" ON "InventoryCount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCount_code_companyId_key" ON "InventoryCount"("code", "companyId");

-- CreateIndex
CREATE INDEX "Item_companyId_idx" ON "Item"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_companyId_key" ON "Item"("code", "companyId");

-- CreateIndex
CREATE INDEX "ItemGroup_companyId_idx" ON "ItemGroup"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroup_name_companyId_key" ON "ItemGroup"("name", "companyId");

-- CreateIndex
CREATE INDEX "PayableAccount_companyId_idx" ON "PayableAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PayableAccount_code_companyId_key" ON "PayableAccount"("code", "companyId");

-- CreateIndex
CREATE INDEX "PaymentVoucher_companyId_idx" ON "PaymentVoucher"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVoucher_code_companyId_key" ON "PaymentVoucher"("code", "companyId");

-- CreateIndex
CREATE INDEX "Permission_companyId_idx" ON "Permission"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_companyId_key" ON "Permission"("resource", "action", "companyId");

-- CreateIndex
CREATE INDEX "PriceQuotation_companyId_idx" ON "PriceQuotation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceQuotation_code_companyId_key" ON "PriceQuotation"("code", "companyId");

-- CreateIndex
CREATE INDEX "PurchaseInvoice_companyId_idx" ON "PurchaseInvoice"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_code_companyId_key" ON "PurchaseInvoice"("code", "companyId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_companyId_idx" ON "PurchaseReturn"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturn_code_companyId_key" ON "PurchaseReturn"("code", "companyId");

-- CreateIndex
CREATE INDEX "ReceiptVoucher_companyId_idx" ON "ReceiptVoucher"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptVoucher_code_companyId_key" ON "ReceiptVoucher"("code", "companyId");

-- CreateIndex
CREATE INDEX "ReceivableAccount_companyId_idx" ON "ReceivableAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceivableAccount_code_companyId_key" ON "ReceivableAccount"("code", "companyId");

-- CreateIndex
CREATE INDEX "RevenueCode_companyId_idx" ON "RevenueCode"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueCode_code_companyId_key" ON "RevenueCode"("code", "companyId");

-- CreateIndex
CREATE INDEX "Role_companyId_idx" ON "Role"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_companyId_key" ON "Role"("name", "companyId");

-- CreateIndex
CREATE INDEX "Safe_companyId_idx" ON "Safe"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Safe_code_companyId_key" ON "Safe"("code", "companyId");

-- CreateIndex
CREATE INDEX "SalesInvoice_companyId_idx" ON "SalesInvoice"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_code_companyId_key" ON "SalesInvoice"("code", "companyId");

-- CreateIndex
CREATE INDEX "SalesReturn_companyId_idx" ON "SalesReturn"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturn_code_companyId_key" ON "SalesReturn"("code", "companyId");

-- CreateIndex
CREATE INDEX "Store_companyId_idx" ON "Store"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_companyId_key" ON "Store"("code", "companyId");

-- CreateIndex
CREATE INDEX "StoreIssueVoucher_companyId_idx" ON "StoreIssueVoucher"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreIssueVoucher_voucherNumber_companyId_key" ON "StoreIssueVoucher"("voucherNumber", "companyId");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucher_companyId_idx" ON "StoreReceiptVoucher"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreReceiptVoucher_voucherNumber_companyId_key" ON "StoreReceiptVoucher"("voucherNumber", "companyId");

-- CreateIndex
CREATE INDEX "StoreTransferVoucher_companyId_idx" ON "StoreTransferVoucher"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransferVoucher_voucherNumber_companyId_key" ON "StoreTransferVoucher"("voucherNumber", "companyId");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_companyId_key" ON "Supplier"("code", "companyId");

-- CreateIndex
CREATE INDEX "Unit_companyId_idx" ON "Unit"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_companyId_key" ON "Unit"("name", "companyId");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_companyId_key" ON "User"("email", "companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemGroup" ADD CONSTRAINT "ItemGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bank" ADD CONSTRAINT "Bank_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Safe" ADD CONSTRAINT "Safe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReceiptVoucher" ADD CONSTRAINT "StoreReceiptVoucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreIssueVoucher" ADD CONSTRAINT "StoreIssueVoucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferVoucher" ADD CONSTRAINT "StoreTransferVoucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentAccount" ADD CONSTRAINT "CurrentAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivableAccount" ADD CONSTRAINT "ReceivableAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayableAccount" ADD CONSTRAINT "PayableAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseType" ADD CONSTRAINT "ExpenseType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCode" ADD CONSTRAINT "ExpenseCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueCode" ADD CONSTRAINT "RevenueCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceQuotation" ADD CONSTRAINT "PriceQuotation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
