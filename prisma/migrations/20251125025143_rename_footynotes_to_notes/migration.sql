/*
 * Historical migration: Rename 'footyNotes' to 'notes'
 *
 * This migration completed the platform rebranding from the original basketball-focused
 * naming conventions. The field name 'footyNotes' was a remnant of the original branding.
 *
 * Date: 2025-11-25
 *
 * Warnings:
 * - You are about to drop the column `footyNotes` on the `Card` table. All the data in the column will be lost.
 */

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "footyNotes",
ADD COLUMN     "notes" TEXT;
