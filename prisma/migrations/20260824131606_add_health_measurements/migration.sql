-- CreateEnum
CREATE TYPE "HealthMeasurementType" AS ENUM ('BLOOD_SUGAR', 'BLOOD_PRESSURE', 'WEIGHT', 'TEMPERATURE', 'HEART_RATE', 'OXYGEN_SATURATION', 'OTHER');

-- CreateTable
CREATE TABLE "HealthMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "HealthMeasurementType" NOT NULL,
    "value" DECIMAL(65,30),
    "unit" TEXT,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "context" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthMeasurementAccess" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "accessLevel" "MedicalRecordAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthMeasurementAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthMeasurement_userId_type_idx" ON "HealthMeasurement"("userId", "type");

-- CreateIndex
CREATE INDEX "HealthMeasurement_userId_measuredAt_idx" ON "HealthMeasurement"("userId", "measuredAt");

-- CreateIndex
CREATE INDEX "HealthMeasurementAccess_familyId_idx" ON "HealthMeasurementAccess"("familyId");

-- CreateIndex
CREATE INDEX "HealthMeasurementAccess_measurementId_idx" ON "HealthMeasurementAccess"("measurementId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthMeasurementAccess_measurementId_familyId_key" ON "HealthMeasurementAccess"("measurementId", "familyId");

-- AddForeignKey
ALTER TABLE "HealthMeasurement" ADD CONSTRAINT "HealthMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthMeasurementAccess" ADD CONSTRAINT "HealthMeasurementAccess_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "HealthMeasurement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthMeasurementAccess" ADD CONSTRAINT "HealthMeasurementAccess_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
