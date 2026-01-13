-- DropIndex (only if exists)
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "AdImage" ADD COLUMN     "brandedUrl" TEXT,
ADD COLUMN     "originalUrl" TEXT;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BrandingConfig" (
    "id" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT 'bottom-left',
    "opacity" INTEGER NOT NULL DEFAULT 70,
    "sizePct" INTEGER NOT NULL DEFAULT 18,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandingConfig_updatedById_idx" ON "BrandingConfig"("updatedById");

-- AddForeignKey
ALTER TABLE "BrandingConfig" ADD CONSTRAINT "BrandingConfig_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
