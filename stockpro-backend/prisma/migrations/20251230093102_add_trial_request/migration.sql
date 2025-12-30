-- CreateEnum
CREATE TYPE "SubscriptionRequestType" AS ENUM ('SUBSCRIPTION', 'TRIAL');

-- AlterTable
ALTER TABLE "SubscriptionRequest" ADD COLUMN "type" "SubscriptionRequestType" NOT NULL DEFAULT 'SUBSCRIPTION';
ALTER TABLE "SubscriptionRequest" ALTER COLUMN "plan" DROP NOT NULL;
ALTER TABLE "SubscriptionRequest" ADD COLUMN "trialDurationDays" INTEGER;
ALTER TABLE "SubscriptionRequest" ADD COLUMN "trialStartDate" TIMESTAMP(3);
ALTER TABLE "SubscriptionRequest" ADD COLUMN "trialEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SubscriptionRequest_type_idx" ON "SubscriptionRequest"("type");

