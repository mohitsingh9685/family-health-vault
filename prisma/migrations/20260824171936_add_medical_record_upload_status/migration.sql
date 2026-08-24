-- CreateEnum
CREATE TYPE "MedicalRecordUploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED');

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "uploadStatus" "MedicalRecordUploadStatus" NOT NULL DEFAULT 'PENDING';
