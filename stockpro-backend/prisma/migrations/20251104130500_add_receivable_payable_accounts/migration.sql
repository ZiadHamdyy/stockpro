-- CreateTable: ReceivableAccount
CREATE TABLE "ReceivableAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReceivableAccount_pkey" PRIMARY KEY ("id")
);

-- Indexes for ReceivableAccount
CREATE UNIQUE INDEX "ReceivableAccount_code_key" ON "ReceivableAccount"("code");
CREATE INDEX "ReceivableAccount_code_idx" ON "ReceivableAccount"("code");

-- CreateTable: PayableAccount
CREATE TABLE "PayableAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PayableAccount_pkey" PRIMARY KEY ("id")
);

-- Indexes for PayableAccount
CREATE UNIQUE INDEX "PayableAccount_code_key" ON "PayableAccount"("code");
CREATE INDEX "PayableAccount_code_idx" ON "PayableAccount"("code");


