-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SalesInvoice" ADD COLUMN     "customerName" TEXT;
