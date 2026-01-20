-- CreateEnum
CREATE TYPE "NewspaperSheetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "proposedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AppointmentHistory" ADD COLUMN     "fromDate" TIMESTAMP(3),
ADD COLUMN     "toDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "NewspaperSheet" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headerImage" TEXT,
    "layoutConfig" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "pdfPath" TEXT,
    "status" "NewspaperSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewspaperSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewspaperSheetListing" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "positionIndex" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewspaperSheetListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewspaperSheetVersion" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewspaperSheetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewspaperSheet_categoryId_idx" ON "NewspaperSheet"("categoryId");

-- CreateIndex
CREATE INDEX "NewspaperSheet_cityId_idx" ON "NewspaperSheet"("cityId");

-- CreateIndex
CREATE INDEX "NewspaperSheet_status_idx" ON "NewspaperSheet"("status");

-- CreateIndex
CREATE INDEX "NewspaperSheet_createdBy_idx" ON "NewspaperSheet"("createdBy");

-- CreateIndex
CREATE INDEX "NewspaperSheet_createdAt_idx" ON "NewspaperSheet"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewspaperSheet_categoryId_cityId_status_key" ON "NewspaperSheet"("categoryId", "cityId", "status");

-- CreateIndex
CREATE INDEX "NewspaperSheetListing_sheetId_idx" ON "NewspaperSheetListing"("sheetId");

-- CreateIndex
CREATE INDEX "NewspaperSheetListing_listingId_idx" ON "NewspaperSheetListing"("listingId");

-- CreateIndex
CREATE INDEX "NewspaperSheetListing_positionIndex_idx" ON "NewspaperSheetListing"("positionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "NewspaperSheetListing_sheetId_listingId_key" ON "NewspaperSheetListing"("sheetId", "listingId");

-- CreateIndex
CREATE INDEX "NewspaperSheetVersion_sheetId_idx" ON "NewspaperSheetVersion"("sheetId");

-- CreateIndex
CREATE INDEX "NewspaperSheetVersion_createdAt_idx" ON "NewspaperSheetVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewspaperSheetVersion_sheetId_version_key" ON "NewspaperSheetVersion"("sheetId", "version");

-- AddForeignKey
ALTER TABLE "NewspaperSheet" ADD CONSTRAINT "NewspaperSheet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheet" ADD CONSTRAINT "NewspaperSheet_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheet" ADD CONSTRAINT "NewspaperSheet_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheetListing" ADD CONSTRAINT "NewspaperSheetListing_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "NewspaperSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheetListing" ADD CONSTRAINT "NewspaperSheetListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheetVersion" ADD CONSTRAINT "NewspaperSheetVersion_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "NewspaperSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheetVersion" ADD CONSTRAINT "NewspaperSheetVersion_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
