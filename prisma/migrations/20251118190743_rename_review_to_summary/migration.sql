-- AlterTable: Rename review fields to summary
ALTER TABLE "Release" RENAME COLUMN "review" TO "summary";
ALTER TABLE "Release" RENAME COLUMN "reviewDate" TO "summaryDate";
