-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "NewspaperSheetAd" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "anchorType" TEXT NOT NULL,
    "beforeListingId" TEXT,
    "page" INTEGER,
    "row" INTEGER,
    "col" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "NewspaperSheetAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewspaperSheetAd_sheetId_idx" ON "NewspaperSheetAd"("sheetId");

-- CreateIndex
CREATE INDEX "NewspaperSheetAd_createdBy_idx" ON "NewspaperSheetAd"("createdBy");

-- CreateIndex
CREATE INDEX "NewspaperSheetAd_createdAt_idx" ON "NewspaperSheetAd"("createdAt");

-- AddForeignKey
ALTER TABLE "NewspaperSheetAd" ADD CONSTRAINT "NewspaperSheetAd_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "NewspaperSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewspaperSheetAd" ADD CONSTRAINT "NewspaperSheetAd_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
