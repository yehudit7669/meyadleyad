/*
  Warnings:

  - A unique constraint covering the columns `[adNumber]` on the table `Ad` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `City` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetPasswordToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdStatus" ADD VALUE 'DRAFT';
ALTER TYPE "AdStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "AdStatus" ADD VALUE 'REMOVED';

-- DropIndex (conditionally)
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "adNumber" SERIAL NOT NULL,
ADD COLUMN     "adType" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "streetId" TEXT;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "verificationExpires" TIMESTAMP(3),
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Street" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "neighborhoodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Street_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAdLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "AdStatus",
    "toStatus" "AdStatus",
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAdLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Neighborhood_cityId_idx" ON "Neighborhood"("cityId");

-- CreateIndex
CREATE INDEX "Neighborhood_name_idx" ON "Neighborhood"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_cityId_name_key" ON "Neighborhood"("cityId", "name");

-- CreateIndex
CREATE INDEX "Street_cityId_idx" ON "Street"("cityId");

-- CreateIndex
CREATE INDEX "Street_name_idx" ON "Street"("name");

-- CreateIndex
CREATE INDEX "Street_neighborhoodId_idx" ON "Street"("neighborhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "Street_cityId_code_key" ON "Street"("cityId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Street_cityId_name_key" ON "Street"("cityId", "name");

-- CreateIndex
CREATE INDEX "AdminAdLog_adminId_idx" ON "AdminAdLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAdLog_adId_idx" ON "AdminAdLog"("adId");

-- CreateIndex
CREATE INDEX "AdminAdLog_createdAt_idx" ON "AdminAdLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_adNumber_key" ON "Ad"("adNumber");

-- CreateIndex
CREATE INDEX "Ad_adNumber_idx" ON "Ad"("adNumber");

-- CreateIndex
CREATE INDEX "Ad_streetId_idx" ON "Ad"("streetId");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_name_idx" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetPasswordToken_key" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "User_resetPasswordToken_idx" ON "User"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "Street"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Street" ADD CONSTRAINT "Street_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Street" ADD CONSTRAINT "Street_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAdLog" ADD CONSTRAINT "AdminAdLog_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
