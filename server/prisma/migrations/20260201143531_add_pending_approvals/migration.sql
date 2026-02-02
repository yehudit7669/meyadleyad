/*
  Warnings:

  - The `status` column on the `EmailOperationsMailingList` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `EmailRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PendingIntent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `commandType` on the `EmailAuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commandType` on the `EmailRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commandType` on the `PendingIntent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum (already exists, commented out to prevent duplicate)
-- CREATE TYPE "EmailCommandType" AS ENUM ('PUBLISH_SALE', 'PUBLISH_RENT', 'PUBLISH_SHABBAT', 'PUBLISH_COMMERCIAL', 'PUBLISH_SHARED_OWNERSHIP', 'WANTED_BUY', 'WANTED_RENT', 'WANTED_SHABBAT', 'UPDATE_AD', 'REMOVE_AD', 'MAILING_LIST_SUBSCRIBE', 'MAILING_LIST_UNSUBSCRIBE', 'REGISTRATION', 'UNKNOWN');

-- CreateEnum (already exists, commented out to prevent duplicate)
-- CREATE TYPE "EmailRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum (already exists, commented out to prevent duplicate)
-- CREATE TYPE "PendingIntentStatus" AS ENUM ('PENDING', 'EXPIRED', 'COMPLETED');

-- CreateEnum (already exists, commented out to prevent duplicate)
-- CREATE TYPE "EmailMailingStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "PendingApprovalType" AS ENUM ('OFFICE_ADDRESS_UPDATE', 'ABOUT_UPDATE', 'LOGO_UPLOAD', 'BUSINESS_DESCRIPTION', 'IMPORT_PERMISSION', 'ACCOUNT_DELETION', 'HIGHLIGHT_AD');

-- DropIndex (already dropped or doesn't exist, commented out to prevent error)
-- DROP INDEX "Ad_isWanted_idx";

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
CREATE TABLE "PendingApproval" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PendingApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestData" JSONB NOT NULL,
    "oldData" JSONB,
    "reason" TEXT,
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingApproval_userId_idx" ON "PendingApproval"("userId");

-- CreateIndex
CREATE INDEX "PendingApproval_type_idx" ON "PendingApproval"("type");

-- CreateIndex
CREATE INDEX "PendingApproval_status_idx" ON "PendingApproval"("status");

-- CreateIndex
CREATE INDEX "PendingApproval_createdAt_idx" ON "PendingApproval"("createdAt");

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
ALTER TABLE "PendingApproval" ADD CONSTRAINT "PendingApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingApproval" ADD CONSTRAINT "PendingApproval_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
