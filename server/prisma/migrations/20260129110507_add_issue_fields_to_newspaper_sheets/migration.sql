/*
  Warnings:

  - The `status` column on the `EmailOperationsMailingList` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `EmailRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PendingIntent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `commandType` on the `EmailAuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commandType` on the `EmailRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commandType` on the `PendingIntent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EmailCommandType" AS ENUM ('PUBLISH_SALE', 'PUBLISH_RENT', 'PUBLISH_SHABBAT', 'PUBLISH_COMMERCIAL', 'PUBLISH_SHARED_OWNERSHIP', 'WANTED_BUY', 'WANTED_RENT', 'WANTED_SHABBAT', 'UPDATE_AD', 'REMOVE_AD', 'MAILING_LIST_SUBSCRIBE', 'MAILING_LIST_UNSUBSCRIBE', 'REGISTRATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EmailRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PendingIntentStatus" AS ENUM ('PENDING', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmailMailingStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- DropIndex (if exists - safe version)
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
ALTER TABLE "NewspaperSheet" ADD COLUMN     "issueDate" TEXT,
ADD COLUMN     "issueNumber" TEXT;

-- AlterTable
ALTER TABLE "PendingIntent" DROP COLUMN "commandType",
ADD COLUMN     "commandType" "EmailCommandType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PendingIntentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

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
