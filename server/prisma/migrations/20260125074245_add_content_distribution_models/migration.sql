/*
  Warnings:

  - The `status` column on the `ContentDispatchLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isActive` on the `MailingListSubscriber` table. All the data in the column will be lost.
  - You are about to drop the `email_permissions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[unsubscribeToken]` on the table `MailingListSubscriber` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MailingListStatus" AS ENUM ('ACTIVE', 'OPT_OUT', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ContentItemType" AS ENUM ('PDF', 'LINK');

-- CreateEnum
CREATE TYPE "ContentItemStatus" AS ENUM ('ACTIVE', 'NOT_DISTRIBUTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DistributionMode" AS ENUM ('INITIAL', 'REDISTRIBUTE', 'PUSH');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- DropIndex
DROP INDEX "Ad_isWanted_idx";

-- DropIndex
DROP INDEX "MailingListSubscriber_isActive_idx";

-- AlterTable
ALTER TABLE "ContentDispatchLog" ADD COLUMN     "contentDistributionId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "DispatchStatus" NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "MailingListSubscriber" DROP COLUMN "isActive",
ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedBy" TEXT,
ADD COLUMN     "emailUpdatesCategories" JSONB,
ADD COLUMN     "emailUpdatesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "MailingListStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "unsubscribeToken" TEXT;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "email_permissions";

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContentItemType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "status" "ContentItemStatus" NOT NULL DEFAULT 'NOT_DISTRIBUTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "lastDistributedAt" TIMESTAMP(3),
    "distributionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDistribution" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "mode" "DistributionMode" NOT NULL,
    "recipientsCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distributedBy" TEXT NOT NULL,

    CONSTRAINT "ContentDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentItem_type_idx" ON "ContentItem"("type");

-- CreateIndex
CREATE INDEX "ContentItem_status_idx" ON "ContentItem"("status");

-- CreateIndex
CREATE INDEX "ContentItem_createdBy_idx" ON "ContentItem"("createdBy");

-- CreateIndex
CREATE INDEX "ContentItem_createdAt_idx" ON "ContentItem"("createdAt");

-- CreateIndex
CREATE INDEX "ContentDistribution_contentItemId_idx" ON "ContentDistribution"("contentItemId");

-- CreateIndex
CREATE INDEX "ContentDistribution_distributedAt_idx" ON "ContentDistribution"("distributedAt");

-- CreateIndex
CREATE INDEX "ContentDistribution_distributedBy_idx" ON "ContentDistribution"("distributedBy");

-- CreateIndex
CREATE INDEX "ContentDispatchLog_contentDistributionId_idx" ON "ContentDispatchLog"("contentDistributionId");

-- CreateIndex
CREATE INDEX "ContentDispatchLog_status_idx" ON "ContentDispatchLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MailingListSubscriber_unsubscribeToken_key" ON "MailingListSubscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "MailingListSubscriber_status_idx" ON "MailingListSubscriber"("status");

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDispatchLog" ADD CONSTRAINT "ContentDispatchLog_contentDistributionId_fkey" FOREIGN KEY ("contentDistributionId") REFERENCES "ContentDistribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
