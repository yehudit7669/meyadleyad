-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "ImportLog" ADD COLUMN     "importedItemIds" JSONB,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;
