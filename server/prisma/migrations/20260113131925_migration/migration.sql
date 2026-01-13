-- DropIndex (if exists)
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;
