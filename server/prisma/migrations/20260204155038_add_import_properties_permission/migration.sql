-- AlterEnum
ALTER TYPE "PendingApprovalType" ADD VALUE 'IMPORT_PROPERTIES_PERMISSION';

-- DropIndex
DROP INDEX IF EXISTS "Ad_isWanted_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" DROP DEFAULT;
