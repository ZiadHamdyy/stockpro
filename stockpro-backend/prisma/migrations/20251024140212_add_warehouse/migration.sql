-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreReceiptVoucher" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreReceiptVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreIssueVoucher" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreIssueVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTransferVoucher" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fromStoreId" TEXT NOT NULL,
    "toStoreId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreTransferVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreReceiptVoucherItem" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "voucherId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreReceiptVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreIssueVoucherItem" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "voucherId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreIssueVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTransferVoucherItem" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "voucherId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreTransferVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreReceiptVoucher_voucherNumber_key" ON "StoreReceiptVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucher_voucherNumber_idx" ON "StoreReceiptVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucher_date_idx" ON "StoreReceiptVoucher"("date");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucher_storeId_idx" ON "StoreReceiptVoucher"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreIssueVoucher_voucherNumber_key" ON "StoreIssueVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "StoreIssueVoucher_voucherNumber_idx" ON "StoreIssueVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "StoreIssueVoucher_date_idx" ON "StoreIssueVoucher"("date");

-- CreateIndex
CREATE INDEX "StoreIssueVoucher_storeId_idx" ON "StoreIssueVoucher"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransferVoucher_voucherNumber_key" ON "StoreTransferVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "StoreTransferVoucher_voucherNumber_idx" ON "StoreTransferVoucher"("voucherNumber");

-- CreateIndex
CREATE INDEX "StoreTransferVoucher_date_idx" ON "StoreTransferVoucher"("date");

-- CreateIndex
CREATE INDEX "StoreTransferVoucher_fromStoreId_idx" ON "StoreTransferVoucher"("fromStoreId");

-- CreateIndex
CREATE INDEX "StoreTransferVoucher_toStoreId_idx" ON "StoreTransferVoucher"("toStoreId");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucherItem_voucherId_idx" ON "StoreReceiptVoucherItem"("voucherId");

-- CreateIndex
CREATE INDEX "StoreReceiptVoucherItem_itemId_idx" ON "StoreReceiptVoucherItem"("itemId");

-- CreateIndex
CREATE INDEX "StoreIssueVoucherItem_voucherId_idx" ON "StoreIssueVoucherItem"("voucherId");

-- CreateIndex
CREATE INDEX "StoreIssueVoucherItem_itemId_idx" ON "StoreIssueVoucherItem"("itemId");

-- CreateIndex
CREATE INDEX "StoreTransferVoucherItem_voucherId_idx" ON "StoreTransferVoucherItem"("voucherId");

-- CreateIndex
CREATE INDEX "StoreTransferVoucherItem_itemId_idx" ON "StoreTransferVoucherItem"("itemId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReceiptVoucher" ADD CONSTRAINT "StoreReceiptVoucher_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReceiptVoucher" ADD CONSTRAINT "StoreReceiptVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreIssueVoucher" ADD CONSTRAINT "StoreIssueVoucher_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreIssueVoucher" ADD CONSTRAINT "StoreIssueVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferVoucher" ADD CONSTRAINT "StoreTransferVoucher_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferVoucher" ADD CONSTRAINT "StoreTransferVoucher_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferVoucher" ADD CONSTRAINT "StoreTransferVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReceiptVoucherItem" ADD CONSTRAINT "StoreReceiptVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "StoreReceiptVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreReceiptVoucherItem" ADD CONSTRAINT "StoreReceiptVoucherItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreIssueVoucherItem" ADD CONSTRAINT "StoreIssueVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "StoreIssueVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreIssueVoucherItem" ADD CONSTRAINT "StoreIssueVoucherItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferVoucherItem" ADD CONSTRAINT "StoreTransferVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "StoreTransferVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferVoucherItem" ADD CONSTRAINT "StoreTransferVoucherItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
