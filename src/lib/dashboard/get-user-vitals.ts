import { prisma } from "@/lib/prisma";

/*
 Dashboard → User Latest Vitals

 Used by:
 src/app/home/page.tsx

 Fetches only logged-in user's latest measurements.
*/

export async function getUserVitals(userId: string) {

  const measurements =
    await prisma.healthMeasurement.findMany({
      where: {
        userId,
      },

      orderBy: {
        measuredAt: "desc",
      },

      take: 10,
    });


  return {
    bloodPressure:
      measurements.find(
        (m) => m.type === "BLOOD_PRESSURE"
      )
      ? `${measurements.find(
          (m) => m.type === "BLOOD_PRESSURE"
        )?.systolic}/${
          measurements.find(
            (m) => m.type === "BLOOD_PRESSURE"
          )?.diastolic
        }`
      : "--",


    weight:
      measurements.find(
        (m) => m.type === "WEIGHT"
      )?.value?.toString() || "--",


    sugar:
      measurements.find(
        (m) => m.type === "BLOOD_SUGAR"
      )?.value?.toString() || "--",


    spo2:
      measurements.find(
        (m) => m.type === "OXYGEN_SATURATION"
      )?.value?.toString() || "--",
  };
}