/*
  Warnings:

  - The `status` column on the `EmailOperationsMailingList` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `EmailRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PendingIntent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `commandType` on the `EmailAuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commandType` on the `EmailRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commandType` on the `PendingIntent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE "EmailCommandType" AS ENUM ('PUBLISH_SALE', 'PUBLISH_RENT', 'PUBLISH_SHABBAT', 'PUBLISH_COMMERCIAL', 'PUBLISH_SHARED_OWNERSHIP', 'WANTED_BUY', 'WANTED_RENT', 'WANTED_SHABBAT', 'UPDATE_AD', 'REMOVE_AD', 'MAILING_LIST_SUBSCRIBE', 'MAILING_LIST_UNSUBSCRIBE', 'REGISTRATION', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE "EmailRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE "PendingIntentStatus" AS ENUM ('PENDING', 'EXPIRED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE "EmailMailingStatus" AS ENUM ('ACTIVE', 'REMOVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
CREATE TYPE "UserNotificationOverrideMode" AS ENUM ('ALLOW', 'BLOCK');

-- CreateEnum
CREATE TYPE "NotificationQueueStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- DropIndex (skip if doesn't exist)
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "EmailAuditLog" DROP COLUMN "commandType",
ADD COLUMN     "commandType" "EmailCommandType" NOT NULL;

-- AlterTable
ALTER TABLE "EmailOperationsMailingList" DROP COLUMN "status",
ADD COLUMN     "status" "EmailMailingStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "EmailRequest" DROP COLUMN "commandType",
ADD COLUMN     "commandType" "EmailCommandType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EmailRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PendingIntent" DROP COLUMN "commandType",
ADD COLUMN     "commandType" "EmailCommandType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PendingIntentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "UserNotificationOverrideMode" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "status" "NotificationQueueStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationOverride_userId_key" ON "UserNotificationOverride"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationOverride_userId_idx" ON "UserNotificationOverride"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationOverride_expiresAt_idx" ON "UserNotificationOverride"("expiresAt");

-- CreateIndex
CREATE INDEX "NotificationQueue_userId_idx" ON "NotificationQueue"("userId");

-- CreateIndex
CREATE INDEX "NotificationQueue_adId_idx" ON "NotificationQueue"("adId");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_idx" ON "NotificationQueue"("status");

-- CreateIndex
CREATE INDEX "NotificationQueue_createdAt_idx" ON "NotificationQueue"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationQueue_userId_adId_key" ON "NotificationQueue"("userId", "adId");

-- CreateIndex
CREATE INDEX "EmailAuditLog_commandType_idx" ON "EmailAuditLog"("commandType");

-- CreateIndex
CREATE INDEX "EmailOperationsMailingList_status_idx" ON "EmailOperationsMailingList"("status");

-- CreateIndex
CREATE INDEX "EmailRequest_commandType_idx" ON "EmailRequest"("commandType");

-- CreateIndex
CREATE INDEX "EmailRequest_status_idx" ON "EmailRequest"("status");

-- CreateIndex
CREATE INDEX "PendingIntent_status_idx" ON "PendingIntent"("status");

-- AddForeignKey
ALTER TABLE "UserNotificationOverride" ADD CONSTRAINT "UserNotificationOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
