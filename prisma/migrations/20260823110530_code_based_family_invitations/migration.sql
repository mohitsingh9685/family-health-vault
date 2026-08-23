/*
  Warnings:

  - You are about to drop the column `email` on the `FamilyInvitation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "FamilyInvitation_email_idx";

-- AlterTable
ALTER TABLE "FamilyInvitation" DROP COLUMN "email";
