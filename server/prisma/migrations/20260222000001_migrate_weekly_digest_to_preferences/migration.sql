-- Migrate existing weeklyDigestOptIn and weeklyDigestSubscribed to UserPreference
-- This consolidates all weekly digest preferences into one place

-- Create UserPreference for users who have weeklyDigestOptIn = true (brokers)
INSERT INTO "UserPreference" ("id", "userId", "weeklyDigest", "notifyNewMatches", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "id",
  true,
  false,
  NOW(),
  NOW()
FROM "User"
WHERE "weeklyDigestOptIn" = true
  AND "id" NOT IN (SELECT "userId" FROM "UserPreference");

-- Create UserPreference for users who have weeklyDigestSubscribed = true (service providers)
INSERT INTO "UserPreference" ("id", "userId", "weeklyDigest", "notifyNewMatches", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  "id",
  true,
  false,
  NOW(),
  NOW()
FROM "User"
WHERE "weeklyDigestSubscribed" = true
  AND "id" NOT IN (SELECT "userId" FROM "UserPreference");

-- Update existing UserPreference records for users who also have weeklyDigestOptIn or weeklyDigestSubscribed
UPDATE "UserPreference"
SET "weeklyDigest" = true, "updatedAt" = NOW()
WHERE "userId" IN (
  SELECT "id" FROM "User" 
  WHERE "weeklyDigestOptIn" = true OR "weeklyDigestSubscribed" = true
);
