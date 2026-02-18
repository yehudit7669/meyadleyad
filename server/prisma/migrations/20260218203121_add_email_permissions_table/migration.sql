-- DropIndex (only if exists)
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "email_permissions" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "permission_type" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'one-time',
    "expiry" TIMESTAMP(3),
    "admin_note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "email_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_permissions_email_idx" ON "email_permissions"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_permissions_is_active_idx" ON "email_permissions"("is_active");
