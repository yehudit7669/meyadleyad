-- AlterTable: Make businessAddressApproved field optional (nullable)
-- This is a safe migration that does not delete any data
-- It only removes the NOT NULL constraint from the column

ALTER TABLE "BrokerOffice" ALTER COLUMN "businessAddressApproved" DROP NOT NULL;
