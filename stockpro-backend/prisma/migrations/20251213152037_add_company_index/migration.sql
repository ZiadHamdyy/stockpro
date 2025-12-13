-- CreateIndex
CREATE INDEX "Branch_companyId_code_idx" ON "Branch"("companyId", "code");

-- CreateIndex
CREATE INDEX "User_companyId_code_idx" ON "User"("companyId", "code");
