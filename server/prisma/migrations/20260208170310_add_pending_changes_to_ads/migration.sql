-- DropIndex
DROP INDEX "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "hasPendingChanges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingChanges" JSONB,
ADD COLUMN     "pendingChangesAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;
