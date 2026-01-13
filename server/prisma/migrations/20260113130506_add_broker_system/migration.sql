-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('USER', 'SERVICE_PROVIDER');

-- CreateEnum
CREATE TYPE "ServiceProviderType" AS ENUM ('BROKER', 'LAWYER', 'APPRAISER', 'DESIGNER_ARCHITECT', 'MORTGAGE_ADVISOR');

-- CreateEnum
CREATE TYPE "FeaturedRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SERVICE_PROVIDER';

-- DropIndex (if exists)
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "brokerCityId" TEXT,
ADD COLUMN     "brokerLicenseNumber" TEXT,
ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "declarationAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "phonePersonal" TEXT,
ADD COLUMN     "serviceProviderType" "ServiceProviderType",
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "userType" "UserType" DEFAULT 'USER',
ADD COLUMN     "weeklyDigestOptIn" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "BrokerOffice" (
    "id" TEXT NOT NULL,
    "brokerOwnerUserId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessAddressApproved" TEXT NOT NULL,
    "businessAddressPending" TEXT,
    "businessPhone" TEXT,
    "website" TEXT,
    "aboutBusinessApproved" TEXT,
    "aboutBusinessPending" TEXT,
    "publishOfficeAddress" BOOLEAN NOT NULL DEFAULT false,
    "logoUrlApproved" TEXT,
    "logoUrlPending" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerTeamMember" (
    "id" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "status" "FeaturedRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'PENDING',
    "exportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerOffice_brokerOwnerUserId_key" ON "BrokerOffice"("brokerOwnerUserId");

-- CreateIndex
CREATE INDEX "BrokerOffice_brokerOwnerUserId_idx" ON "BrokerOffice"("brokerOwnerUserId");

-- CreateIndex
CREATE INDEX "BrokerTeamMember_officeId_idx" ON "BrokerTeamMember"("officeId");

-- CreateIndex
CREATE INDEX "BrokerTeamMember_email_idx" ON "BrokerTeamMember"("email");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "FeaturedRequest_userId_idx" ON "FeaturedRequest"("userId");

-- CreateIndex
CREATE INDEX "FeaturedRequest_adId_idx" ON "FeaturedRequest"("adId");

-- CreateIndex
CREATE INDEX "FeaturedRequest_status_idx" ON "FeaturedRequest"("status");

-- CreateIndex
CREATE INDEX "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");

-- CreateIndex
CREATE INDEX "DataExportRequest_status_idx" ON "DataExportRequest"("status");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_userId_idx" ON "AccountDeletionRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_status_idx" ON "AccountDeletionRequest"("status");

-- CreateIndex
CREATE INDEX "User_brokerCityId_idx" ON "User"("brokerCityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brokerCityId_fkey" FOREIGN KEY ("brokerCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerTeamMember" ADD CONSTRAINT "BrokerTeamMember_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "BrokerOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
