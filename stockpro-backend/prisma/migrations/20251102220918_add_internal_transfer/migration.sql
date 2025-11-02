-- CreateTable
CREATE TABLE "InternalTransfer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "fromType" TEXT NOT NULL,
    "toType" TEXT NOT NULL,
    "fromSafeId" TEXT,
    "fromBankId" TEXT,
    "toSafeId" TEXT,
    "toBankId" TEXT,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalTransfer_code_key" ON "InternalTransfer"("code");

-- CreateIndex
CREATE INDEX "InternalTransfer_code_idx" ON "InternalTransfer"("code");

-- CreateIndex
CREATE INDEX "InternalTransfer_date_idx" ON "InternalTransfer"("date");

-- CreateIndex
CREATE INDEX "InternalTransfer_userId_idx" ON "InternalTransfer"("userId");

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_fromSafeId_fkey" FOREIGN KEY ("fromSafeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_fromBankId_fkey" FOREIGN KEY ("fromBankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_toSafeId_fkey" FOREIGN KEY ("toSafeId") REFERENCES "Safe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_toBankId_fkey" FOREIGN KEY ("toBankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
