-- Add Service Provider specific fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phonePersonal" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneBusinessOffice" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "officeAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "officeAddressPending" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "officeAddressStatus" TEXT DEFAULT 'APPROVED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "logoUrlPending" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "logoStatus" TEXT DEFAULT 'APPROVED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aboutBusiness" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aboutBusinessPending" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aboutBusinessStatus" TEXT DEFAULT 'APPROVED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publishOfficeAddress" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessHours" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "weeklyDigestSubscribed" BOOLEAN DEFAULT false;

-- Create table for Office Address Change Requests
CREATE TABLE IF NOT EXISTS "OfficeAddressChangeRequest" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "newAddress" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT
);

CREATE INDEX IF NOT EXISTS "OfficeAddressChangeRequest_userId_idx" ON "OfficeAddressChangeRequest"("userId");
CREATE INDEX IF NOT EXISTS "OfficeAddressChangeRequest_status_idx" ON "OfficeAddressChangeRequest"("status");

-- Create table for Highlight Requests (for service providers)
CREATE TABLE IF NOT EXISTS "HighlightRequest" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "requestType" TEXT NOT NULL, -- 'SERVICE_CARD' or 'BUSINESS_PAGE'
  "reason" TEXT,
  "status" TEXT DEFAULT 'PENDING',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT
);

CREATE INDEX IF NOT EXISTS "HighlightRequest_userId_idx" ON "HighlightRequest"("userId");
CREATE INDEX IF NOT EXISTS "HighlightRequest_status_idx" ON "HighlightRequest"("status");

-- DataExportRequest and AccountDeletionRequest already exist, no need to recreate
