import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyMember,
} from "@/lib/auth/authorization";
import { createHealthMeasurementSchema } from "@/lib/validation/health-measurement";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

const { familyId, ...measurementBody } = body;

const result = createHealthMeasurementSchema.safeParse(measurementBody);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;
    try {
  await requireFamilyMember(session.user.id, familyId);
} catch (error) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  throw error;
}

    // [Health Measurement → Prisma]
// Store the measurement and its family access together.
const measurement = await prisma.healthMeasurement.create({
  data: {
    userId: session.user.id,
    type: data.type,
    value: data.value,
    unit: data.unit,
    systolic: data.systolic,
    diastolic: data.diastolic,
    context: data.context,
    measuredAt: data.measuredAt,
    notes: data.notes,

    // [HealthMeasurement → HealthMeasurementAccess]
    // Allow the selected family to view this measurement.
    accesses: {
      create: {
        familyId,
        accessLevel: "VIEWER",
      },
    },
  },
});
    return NextResponse.json(
      { measurement },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create health measurement:", error);

    return NextResponse.json(
      { error: "Failed to create health measurement" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const measurements = await prisma.healthMeasurement.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        measuredAt: "desc",
      },
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error("Failed to fetch health measurements:", error);

    return NextResponse.json(
      { error: "Failed to fetch health measurements" },
      { status: 500 }
    );
  }
}