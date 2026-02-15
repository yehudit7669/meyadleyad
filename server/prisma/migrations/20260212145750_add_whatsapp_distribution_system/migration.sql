/*
  Warnings:

  - You are about to drop the column `categoryId` on the `WhatsAppGroup` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `WhatsAppGroup` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `WhatsAppGroup` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[internalCode]` on the table `WhatsAppGroup` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `internalCode` to the `WhatsAppGroup` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WhatsAppGroupStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DistributionStrategy" AS ENUM ('ROUND_ROBIN', 'LEAST_LOADED', 'MANUAL');

-- CreateEnum
CREATE TYPE "DistributionChannelStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "DistributionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SENT', 'DEFERRED', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- DropIndex
DROP INDEX IF EXISTS "WhatsAppGroup_categoryId_idx";

-- DropIndex
DROP INDEX IF EXISTS "WhatsAppGroup_categoryId_key";

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "whatsappSentBy" TEXT;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WhatsAppGroup" DROP COLUMN "categoryId",
DROP COLUMN "groupId",
DROP COLUMN "isActive",
ADD COLUMN     "allowDigest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "categoryScopes" JSONB,
ADD COLUMN     "cityScopes" JSONB,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "dailyQuota" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "internalCode" TEXT NOT NULL,
ADD COLUMN     "inviteLink" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "regionScopes" JSONB,
ADD COLUMN     "status" "WhatsAppGroupStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "DistributionChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" "DistributionStrategy" NOT NULL DEFAULT 'ROUND_ROBIN',
    "status" "DistributionChannelStatus" NOT NULL DEFAULT 'ACTIVE',
    "routingRules" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionItem" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "groupId" TEXT,
    "channelId" TEXT,
    "status" "DistributionItemStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "dedupeKey" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "payloadSnapshot" JSONB,
    "digestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionDigest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "status" "DistributionItemStatus" NOT NULL DEFAULT 'PENDING',
    "payloadSnapshot" JSONB,
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionDigest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppGroupSuggestion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "cityScopes" JSONB,
    "regionScopes" JSONB,
    "categoryScopes" JSONB,
    "dailyQuota" INTEGER NOT NULL DEFAULT 10,
    "allowDigest" BOOLEAN NOT NULL DEFAULT true,
    "status" "WhatsAppSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedGroupId" TEXT,

    CONSTRAINT "WhatsAppGroupSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistributionChannel_status_idx" ON "DistributionChannel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionItem_dedupeKey_key" ON "DistributionItem"("dedupeKey");

-- CreateIndex
CREATE INDEX "DistributionItem_status_idx" ON "DistributionItem"("status");

-- CreateIndex
CREATE INDEX "DistributionItem_adId_idx" ON "DistributionItem"("adId");

-- CreateIndex
CREATE INDEX "DistributionItem_groupId_idx" ON "DistributionItem"("groupId");

-- CreateIndex
CREATE INDEX "DistributionItem_channelId_idx" ON "DistributionItem"("channelId");

-- CreateIndex
CREATE INDEX "DistributionItem_scheduledFor_idx" ON "DistributionItem"("scheduledFor");

-- CreateIndex
CREATE INDEX "DistributionItem_sentAt_idx" ON "DistributionItem"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionItem_adId_groupId_key" ON "DistributionItem"("adId", "groupId");

-- CreateIndex
CREATE INDEX "DistributionDigest_groupId_idx" ON "DistributionDigest"("groupId");

-- CreateIndex
CREATE INDEX "DistributionDigest_status_idx" ON "DistributionDigest"("status");

-- CreateIndex
CREATE INDEX "WhatsAppAuditLog_actorUserId_idx" ON "WhatsAppAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "WhatsAppAuditLog_entityType_entityId_idx" ON "WhatsAppAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "WhatsAppAuditLog_createdAt_idx" ON "WhatsAppAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppGroupSuggestion_status_idx" ON "WhatsAppGroupSuggestion"("status");

-- CreateIndex
CREATE INDEX "WhatsAppGroupSuggestion_suggestedBy_idx" ON "WhatsAppGroupSuggestion"("suggestedBy");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppGroup_internalCode_key" ON "WhatsAppGroup"("internalCode");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_status_idx" ON "WhatsAppGroup"("status");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_internalCode_idx" ON "WhatsAppGroup"("internalCode");

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WhatsAppGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "DistributionChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "DistributionDigest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppGroupSuggestion" ADD CONSTRAINT "WhatsAppGroupSuggestion_approvedGroupId_fkey" FOREIGN KEY ("approvedGroupId") REFERENCES "WhatsAppGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
