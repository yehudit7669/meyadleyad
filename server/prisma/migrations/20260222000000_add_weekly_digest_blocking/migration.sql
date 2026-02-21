-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "weeklyDigestBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyDigestBlockedAt" TIMESTAMP(3),
ADD COLUMN     "weeklyDigestBlockedBy" TEXT;
