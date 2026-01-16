/*
  Warnings:

  - The `status` column on the `HighlightRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `OfficeAddressChangeRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `officeAddressStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `logoStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `aboutBusinessStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `publishOfficeAddress` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weeklyDigestSubscribed` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PARTIAL_BLOCK', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';

-- DropForeignKey
ALTER TABLE "HighlightRequest" DROP CONSTRAINT "HighlightRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "OfficeAddressChangeRequest" DROP CONSTRAINT "OfficeAddressChangeRequest_userId_fkey";

-- DropIndex
DROP INDEX "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "AdminAuditLog" ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "ip" TEXT;

-- AlterTable
ALTER TABLE "HighlightRequest" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "OfficeAddressChangeRequest" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "meetingsBlockReason" TEXT,
ADD COLUMN     "meetingsBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingsBlockedAt" TIMESTAMP(3),
ADD COLUMN     "meetingsBlockedByAdminId" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "officeAddressStatus",
ADD COLUMN     "officeAddressStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
DROP COLUMN "logoStatus",
ADD COLUMN     "logoStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
DROP COLUMN "aboutBusinessStatus",
ADD COLUMN     "aboutBusinessStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ALTER COLUMN "publishOfficeAddress" SET NOT NULL,
ALTER COLUMN "weeklyDigestSubscribed" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserAudit" ADD COLUMN     "ip" TEXT;

-- CreateTable
CREATE TABLE "NewspaperAd" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "NewspaperAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewspaperAd_adId_idx" ON "NewspaperAd"("adId");

-- CreateIndex
CREATE INDEX "NewspaperAd_createdBy_idx" ON "NewspaperAd"("createdBy");

-- CreateIndex
CREATE INDEX "NewspaperAd_createdAt_idx" ON "NewspaperAd"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetId_idx" ON "AdminAuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_idx" ON "AdminAuditLog"("entityType");

-- CreateIndex
CREATE INDEX "HighlightRequest_status_idx" ON "HighlightRequest"("status");

-- CreateIndex
CREATE INDEX "OfficeAddressChangeRequest_status_idx" ON "OfficeAddressChangeRequest"("status");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeAddressChangeRequest" ADD CONSTRAINT "OfficeAddressChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightRequest" ADD CONSTRAINT "HighlightRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperAd" ADD CONSTRAINT "NewspaperAd_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperAd" ADD CONSTRAINT "NewspaperAd_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
