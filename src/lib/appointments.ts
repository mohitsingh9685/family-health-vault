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
  familyUserIds: string[],
  limit = 3,
) {
  // No family members means there cannot be a family appointment.
  if (familyUserIds.length === 0) {
    return [];
  }

  return prisma.appointment.findMany({
    where: {
      // [Appointment Status]
      // Visited appointments must never appear in upcoming lists.
      status: "UPCOMING",

      // [Appointment Date]
      // Ignore appointments that have already passed.
      appointmentDate: {
        gte: new Date(),
      },

      // [Family Authorization]
      // An appointment belongs to this family when either:
      // 1. a family member created it, or
      // 2. a family member is the patient.
      OR: [
        {
          createdById: {
            in: familyUserIds,
          },
        },
        {
          patientId: {
            in: familyUserIds,
          },
        },
      ],
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