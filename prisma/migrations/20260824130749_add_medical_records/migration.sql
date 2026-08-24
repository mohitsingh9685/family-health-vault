-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('PRESCRIPTION', 'BLOOD_REPORT', 'DISCHARGE_SUMMARY', 'XRAY', 'MRI', 'CT_SCAN', 'LAB_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalRecordProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MedicalRecordAccessLevel" AS ENUM ('OWNER', 'VIEWER');

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MedicalRecordType" NOT NULL,
    "description" TEXT,
    "storageKey" TEXT,
    "processingStatus" "MedicalRecordProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecordAccess" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "accessLevel" "MedicalRecordAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecordAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalRecord_userId_idx" ON "MedicalRecord"("userId");

-- CreateIndex
CREATE INDEX "MedicalRecord_userId_createdAt_idx" ON "MedicalRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicalRecordAccess_familyId_idx" ON "MedicalRecordAccess"("familyId");

-- CreateIndex
CREATE INDEX "MedicalRecordAccess_medicalRecordId_idx" ON "MedicalRecordAccess"("medicalRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecordAccess_medicalRecordId_familyId_key" ON "MedicalRecordAccess"("medicalRecordId", "familyId");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecordAccess" ADD CONSTRAINT "MedicalRecordAccess_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecordAccess" ADD CONSTRAINT "MedicalRecordAccess_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
