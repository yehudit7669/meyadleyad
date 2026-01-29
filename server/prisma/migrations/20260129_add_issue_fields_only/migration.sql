-- Add issue fields to NewspaperSheet table
-- Safe migration - only adds nullable columns, no data loss

ALTER TABLE "NewspaperSheet" 
ADD COLUMN IF NOT EXISTS "issueNumber" TEXT,
ADD COLUMN IF NOT EXISTS "issueDate" TEXT;
