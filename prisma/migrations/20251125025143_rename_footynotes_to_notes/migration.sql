/*
  Warnings:

  - You are about to drop the column `footyNotes` on the `Card` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "footyNotes",
ADD COLUMN     "notes" TEXT;
