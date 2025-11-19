-- Rename totalCards to expectedCardCount and convert from String to Int
-- Step 1: Add the new column as integer
ALTER TABLE "Set" ADD COLUMN "expectedCardCount" INTEGER;

-- Step 2: Migrate data - convert string to integer where valid
UPDATE "Set"
SET "expectedCardCount" = CAST("totalCards" AS INTEGER)
WHERE "totalCards" IS NOT NULL
  AND "totalCards" ~ '^[0-9]+$';

-- Step 3: Drop the old column
ALTER TABLE "Set" DROP COLUMN "totalCards";
