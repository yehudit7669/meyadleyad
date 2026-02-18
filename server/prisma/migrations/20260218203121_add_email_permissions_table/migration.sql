-- DropIndex
DROP INDEX "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "EmailPermission" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "permissionType" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'one-time',
    "expiry" TIMESTAMP(3),
    "adminNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EmailPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailPermission_email_idx" ON "EmailPermission"("email");

-- CreateIndex
CREATE INDEX "EmailPermission_isActive_idx" ON "EmailPermission"("isActive");
