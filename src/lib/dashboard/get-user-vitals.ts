import { prisma } from "@/lib/prisma";

/*
 Dashboard → User Latest Vitals

 Used by:
 src/app/home/page.tsx

 Fetches only logged-in user's latest measurements.
*/

export async function getUserVitals(userId: string) {
  const [bloodPressure, weight, bloodSugar, oxygenSaturation] =
    await Promise.all([
      prisma.healthMeasurement.findFirst({
        where: { userId, type: "BLOOD_PRESSURE" },
        orderBy: { measuredAt: "desc" },
      }),
      prisma.healthMeasurement.findFirst({
        where: { userId, type: "WEIGHT" },
        orderBy: { measuredAt: "desc" },
      }),
      prisma.healthMeasurement.findFirst({
        where: { userId, type: "BLOOD_SUGAR" },
        orderBy: { measuredAt: "desc" },
      }),
      prisma.healthMeasurement.findFirst({
        where: { userId, type: "OXYGEN_SATURATION" },
        orderBy: { measuredAt: "desc" },
      }),
    ]);

  return {
    bloodPressure:
      bloodPressure?.systolic != null &&
      bloodPressure.diastolic != null
        ? `${bloodPressure.systolic}/${bloodPressure.diastolic}`
        : "--",
    weight: weight?.value?.toString() ?? "--",
    sugar: bloodSugar?.value?.toString() ?? "--",
    spo2: oxygenSaturation?.value?.toString() ?? "--",
  };
}