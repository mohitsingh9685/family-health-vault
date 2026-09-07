import { prisma } from "@/lib/prisma";

/**
 * [Appointments → Shared Data Layer]
 *
 * Fetches the nearest upcoming appointments for a family.
 *
 * This keeps appointment database logic outside:
 * - src/app/home/page.tsx
 * - src/app/appointments/page.tsx
 *
 * The UI components should only receive the resulting data.
 */
export async function getUpcomingAppointments(
  familyId: string,
  limit = 3,
) {
  return prisma.appointment.findMany({
    where: {
      // [Family Isolation]
      // Every appointment belongs to exactly one family. Filtering by
      // familyId prevents appointments leaking between shared members'
      // other families.
      familyId,

      // [Appointment Status]
      // Visited appointments must never appear in upcoming lists.
      status: "UPCOMING",

      // [Appointment Date]
      // Ignore appointments that have already passed.
      appointmentDate: {
        gte: new Date(),
      },
    },

    // [Appointment → Patient]
    // Only fetch the patient information required by the UI.
    include: {
      patient: {
        select: {
          email: true,

          profile: {
            select: {
              name: true,
            },
          },
        },
      },
    },

    // [Home → Upcoming Appointments]
    // Nearest appointment first.
    orderBy: {
      appointmentDate: "asc",
    },

    // Home only needs the latest 3.
    take: limit,
  });
}

/**
 * Format a stored UTC appointment instant in the timezone captured from the
 * user's browser when the appointment was created.
 */
export function formatAppointmentDate(
  appointmentDate: Date,
  timeZone: string,
) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone,
  }).format(appointmentDate);
}

export function formatAppointmentTime(
  appointmentDate: Date,
  timeZone: string,
) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(appointmentDate);
}
