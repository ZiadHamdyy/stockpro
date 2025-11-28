-- CreateTable
CREATE TABLE "PriceQuotation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "items" JSONB NOT NULL,
    "totals" JSONB NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceQuotation_code_key" ON "PriceQuotation"("code");
CREATE INDEX "PriceQuotation_code_idx" ON "PriceQuotation"("code");
CREATE INDEX "PriceQuotation_date_idx" ON "PriceQuotation"("date");
CREATE INDEX "PriceQuotation_customerId_idx" ON "PriceQuotation"("customerId");
CREATE INDEX "PriceQuotation_userId_idx" ON "PriceQuotation"("userId");
CREATE INDEX "PriceQuotation_branchId_idx" ON "PriceQuotation"("branchId");

-- AddForeignKey
ALTER TABLE "PriceQuotation" ADD CONSTRAINT "PriceQuotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceQuotation" ADD CONSTRAINT "PriceQuotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceQuotation" ADD CONSTRAINT "PriceQuotation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
