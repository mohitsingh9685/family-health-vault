-- Durable, shared login throttling state for all application instances.
CREATE TABLE "LoginRateLimit" (
    "key" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "LoginRateLimit_updatedAt_idx"
    ON "LoginRateLimit"("updatedAt");

-- Supports latest-per-type vitals and future bounded trend queries.
CREATE INDEX "HealthMeasurement_userId_type_measuredAt_idx"
    ON "HealthMeasurement"("userId", "type", "measuredAt");

-- Account deletion must not fail on appointment foreign keys.
ALTER TABLE "Appointment"
    DROP CONSTRAINT "Appointment_createdById_fkey";
ALTER TABLE "Appointment"
    DROP CONSTRAINT "Appointment_patientId_fkey";

ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
