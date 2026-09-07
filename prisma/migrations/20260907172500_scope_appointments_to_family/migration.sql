-- Add the family scope before enforcing it so existing appointments can be backfilled.
ALTER TABLE "Appointment" ADD COLUMN "familyId" TEXT;

-- Existing appointment creation used the creator's first shared family.
-- Preserve those rows by selecting the earliest family containing both users.
UPDATE "Appointment" AS appointment
SET "familyId" = (
    SELECT creator_membership."familyId"
    FROM "FamilyMember" AS creator_membership
    INNER JOIN "FamilyMember" AS patient_membership
        ON patient_membership."familyId" = creator_membership."familyId"
       AND patient_membership."userId" = appointment."patientId"
    WHERE creator_membership."userId" = appointment."createdById"
    ORDER BY creator_membership."createdAt" ASC
    LIMIT 1
);

-- Stop rather than silently assigning an appointment to the wrong family.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Appointment"
        WHERE "familyId" IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot migrate appointments without a shared creator/patient family';
    END IF;
END $$;

ALTER TABLE "Appointment" ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX "Appointment_familyId_appointmentDate_idx"
    ON "Appointment"("familyId", "appointmentDate");
CREATE INDEX "Appointment_createdById_idx"
    ON "Appointment"("createdById");
CREATE INDEX "Appointment_patientId_idx"
    ON "Appointment"("patientId");

ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
