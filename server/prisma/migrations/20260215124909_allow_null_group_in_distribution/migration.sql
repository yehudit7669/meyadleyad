-- DropIndex
DROP INDEX "Ad_isWanted_idx";

-- DropIndex
DROP INDEX "DistributionItem_adId_groupId_key";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;
