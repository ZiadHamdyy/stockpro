-- Add unique constraint to enforce one Store per Branch
CREATE UNIQUE INDEX "Store_branchId_key" ON "Store"("branchId");

-- Add index on branchId for better query performance
CREATE INDEX "Store_branchId_idx" ON "Store"("branchId");

