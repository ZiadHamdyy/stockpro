-- Add unique constraint to enforce one Safe per Branch
CREATE UNIQUE INDEX "Safe_branchId_key" ON "Safe"("branchId");


