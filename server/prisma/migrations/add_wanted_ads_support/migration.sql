-- AlterTable: Make cityId nullable and add wanted ads support
ALTER TABLE "Ad" ALTER COLUMN "cityId" DROP NOT NULL;

-- Add new columns for wanted ads
ALTER TABLE "Ad" ADD COLUMN "isWanted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ad" ADD COLUMN "requestedLocationText" TEXT;

-- Create index for wanted ads filtering
CREATE INDEX "Ad_isWanted_idx" ON "Ad"("isWanted");

-- Update existing ads to have isWanted = false (they are regular property ads)
UPDATE "Ad" SET "isWanted" = false WHERE "isWanted" IS NULL;
