-- Existing appointments were entered in the project's India-based development
-- environment. Preserve their intended display timezone while new appointments
-- provide the browser's actual IANA timezone.
ALTER TABLE "Appointment"
ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';
