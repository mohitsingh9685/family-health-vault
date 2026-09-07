import { prisma } from "@/lib/prisma";

/*
  Dashboard → Family Overview

  Responsibility:
  - Fetch family members
  - Fetch their latest health measurements
  - Return data needed by UI

  Used by:
  src/app/home/page.tsx
*/

export async function getFamilyOverview(
  familyId: string,
  viewerUserId: string,
) {
  const members = await prisma.familyMember.findMany({
    where: {
      familyId,
    },

    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
            },
          },

          healthMeasurements: {
            where: {
              type: {
                in: [
                  "BLOOD_PRESSURE",
                  "WEIGHT",
                  "BLOOD_SUGAR",
                  "OXYGEN_SATURATION",
                ],
              },
              OR: [
                {
                  userId: viewerUserId,
                },
                {
                  accesses: {
                    some: {
                      familyId,
                    },
                  },
                },
              ],
            },

            orderBy: {
              measuredAt: "desc",
            },

            take: 20,
          },
        },
      },
    },

    orderBy: {
      createdAt: "asc",
    },
  });


  return members.map((member) => {

    const measurements =
      member.user.healthMeasurements;


    const latestBP =
      measurements.find(
        (item) =>
          item.type === "BLOOD_PRESSURE",
      );


    const latestWeight =
      measurements.find(
        (item) =>
          item.type === "WEIGHT",
      );


    const latestSugar =
      measurements.find(
        (item) =>
          item.type === "BLOOD_SUGAR",
      );


    const latestSpO2 =
      measurements.find(
        (item) =>
          item.type === "OXYGEN_SATURATION",
      );


    return {
      id: member.id,

      userId: member.user.id,

      name:
        member.user.profile?.name ||
        member.user.email.split("@")[0],

      email: member.user.email,

      role: member.role,

      lastUpdatedAt: measurements[0]?.measuredAt ?? null,

      vitals: {
        bloodPressure: latestBP
          ? `${latestBP.systolic}/${latestBP.diastolic}`
          : "--",

        weight: latestWeight
          ? `${latestWeight.value}`
          : "--",

        sugar: latestSugar
          ? `${latestSugar.value}`
          : "--",

        spo2: latestSpO2
          ? `${latestSpO2.value}`
          : "--",
      },
    };
  });
}