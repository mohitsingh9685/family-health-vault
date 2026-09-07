import { prisma } from "@/lib/prisma";

export const healthTrendRanges = [7, 30, 90] as const;
export type HealthTrendRange = (typeof healthTrendRanges)[number];

export function parseHealthTrendRange(
  value: string | undefined,
): HealthTrendRange {
  const parsed = Number(value);

  return healthTrendRanges.includes(parsed as HealthTrendRange)
    ? (parsed as HealthTrendRange)
    : 30;
}

export async function getHealthTrends(
  userId: string,
  rangeDays: HealthTrendRange,
) {
  const measuredAfter = new Date();
  measuredAfter.setDate(measuredAfter.getDate() - rangeDays);

  const measurements = await prisma.healthMeasurement.findMany({
    where: {
      userId,
      type: {
        in: ["BLOOD_PRESSURE", "WEIGHT", "BLOOD_SUGAR"],
      },
      measuredAt: {
        gte: measuredAfter,
        lte: new Date(),
      },
    },
    select: {
      id: true,
      type: true,
      value: true,
      systolic: true,
      diastolic: true,
      measuredAt: true,
    },
    orderBy: {
      measuredAt: "asc",
    },
  });

  return {
    rangeDays,
    bloodPressure: measurements
      .filter(
        (measurement) =>
          measurement.type === "BLOOD_PRESSURE" &&
          measurement.systolic != null &&
          measurement.diastolic != null,
      )
      .map((measurement) => ({
        id: measurement.id,
        measuredAt: measurement.measuredAt,
        systolic: measurement.systolic as number,
        diastolic: measurement.diastolic as number,
      })),
    weight: measurements
      .filter(
        (measurement) =>
          measurement.type === "WEIGHT" && measurement.value != null,
      )
      .map((measurement) => ({
        id: measurement.id,
        measuredAt: measurement.measuredAt,
        value: Number(measurement.value),
      })),
    bloodSugar: measurements
      .filter(
        (measurement) =>
          measurement.type === "BLOOD_SUGAR" &&
          measurement.value != null,
      )
      .map((measurement) => ({
        id: measurement.id,
        measuredAt: measurement.measuredAt,
        value: Number(measurement.value),
      })),
  };
}

export type HealthTrends = Awaited<ReturnType<typeof getHealthTrends>>;
