-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- DropIndex
DROP INDEX IF EXISTS "DistributionItem_adId_groupId_key";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;
