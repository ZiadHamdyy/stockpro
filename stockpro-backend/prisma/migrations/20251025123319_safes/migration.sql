-- CreateTable
CREATE TABLE "Safe" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Safe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Safe_code_key" ON "Safe"("code");

-- CreateIndex
CREATE INDEX "Safe_code_idx" ON "Safe"("code");

-- CreateIndex
CREATE INDEX "Safe_branchId_idx" ON "Safe"("branchId");

-- AddForeignKey
ALTER TABLE "Safe" ADD CONSTRAINT "Safe_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
