-- Fix RefreshToken id default value
ALTER TABLE "RefreshToken" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
