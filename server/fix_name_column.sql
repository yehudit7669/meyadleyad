-- Make name column nullable in User table
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL;
