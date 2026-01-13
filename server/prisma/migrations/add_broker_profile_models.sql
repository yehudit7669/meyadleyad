-- Add pendingEmail to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT;

-- Create BrokerOffice table
CREATE TABLE IF NOT EXISTS "BrokerOffice" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "BrokerOffice_brokerOwnerUserId_key" ON "BrokerOffice"("brokerOwnerUserId");
CREATE INDEX IF NOT EXISTS "BrokerOffice_brokerOwnerUserId_idx" ON "BrokerOffice"("brokerOwnerUserId");

-- Create BrokerTeamMember table
CREATE TABLE IF NOT EXISTS "BrokerTeamMember" (
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

CREATE INDEX IF NOT EXISTS "BrokerTeamMember_officeId_idx" ON "BrokerTeamMember"("officeId");
CREATE INDEX IF NOT EXISTS "BrokerTeamMember_email_idx" ON "BrokerTeamMember"("email");

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
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

CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "AuditLog_actionType_idx" ON "AuditLog"("actionType");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Create FeaturedRequest table
CREATE TABLE IF NOT EXISTS "FeaturedRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeaturedRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FeaturedRequest_userId_idx" ON "FeaturedRequest"("userId");
CREATE INDEX IF NOT EXISTS "FeaturedRequest_adId_idx" ON "FeaturedRequest"("adId");
CREATE INDEX IF NOT EXISTS "FeaturedRequest_status_idx" ON "FeaturedRequest"("status");

-- Create DataExportRequest table
CREATE TABLE IF NOT EXISTS "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "exportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");
CREATE INDEX IF NOT EXISTS "DataExportRequest_status_idx" ON "DataExportRequest"("status");

-- Create AccountDeletionRequest table
CREATE TABLE IF NOT EXISTS "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountDeletionRequest_userId_idx" ON "AccountDeletionRequest"("userId");
CREATE INDEX IF NOT EXISTS "AccountDeletionRequest_status_idx" ON "AccountDeletionRequest"("status");

-- Add foreign key constraints
ALTER TABLE "BrokerTeamMember" DROP CONSTRAINT IF EXISTS "BrokerTeamMember_officeId_fkey";
ALTER TABLE "BrokerTeamMember" ADD CONSTRAINT "BrokerTeamMember_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "BrokerOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
