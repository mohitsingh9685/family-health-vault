-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN     "role" "FamilyRole" NOT NULL DEFAULT 'MEMBER';
