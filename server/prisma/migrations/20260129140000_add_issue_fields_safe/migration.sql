-- Add issue fields to NewspaperSheet (safe migration)
ALTER TABLE "NewspaperSheet" 
ADD COLUMN IF NOT EXISTS "issueNumber" TEXT,
ADD COLUMN IF NOT EXISTS "issueDate" TEXT;
