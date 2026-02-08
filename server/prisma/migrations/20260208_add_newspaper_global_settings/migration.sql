-- CreateTable
CREATE TABLE "NewspaperGlobalSettings" (
    "id" TEXT NOT NULL,
    "currentIssue" INTEGER NOT NULL DEFAULT 1,
    "lastDistributed" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewspaperGlobalSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default row
INSERT INTO "NewspaperGlobalSettings" ("id", "currentIssue", "createdAt", "updatedAt")
VALUES ('default', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
