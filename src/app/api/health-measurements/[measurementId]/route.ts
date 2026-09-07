import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  persistedHealthMeasurementSchema,
  updateHealthMeasurementSchema,
} from "@/lib/validation/health-measurement";

type RouteContext = {
  params: Promise<{ measurementId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { measurementId } = await params;

    const measurement = await prisma.healthMeasurement.findFirst({
      where: {
        id: measurementId,
        userId: session.user.id,
      },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: "Health measurement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ measurement });
  } catch (error) {
    console.error("Failed to fetch health measurement:", error);

    return NextResponse.json(
      { error: "Failed to fetch health measurement" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { measurementId } = await params;
    const body = await request.json();

    const result = updateHealthMeasurementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingMeasurement =
      await prisma.healthMeasurement.findFirst({
        where: {
          id: measurementId,
          userId: session.user.id,
        },
      });

    if (!existingMeasurement) {
      return NextResponse.json(
        { error: "Health measurement not found" },
        { status: 404 }
      );
    }

    const mergedState = persistedHealthMeasurementSchema.safeParse({
      type: result.data.type ?? existingMeasurement.type,
      value:
        result.data.value !== undefined
          ? result.data.value
          : existingMeasurement.value?.toNumber() ?? null,
      unit:
        result.data.unit !== undefined
          ? result.data.unit
          : existingMeasurement.unit,
      systolic:
        result.data.systolic !== undefined
          ? result.data.systolic
          : existingMeasurement.systolic,
      diastolic:
        result.data.diastolic !== undefined
          ? result.data.diastolic
          : existingMeasurement.diastolic,
      context:
        result.data.context !== undefined
          ? result.data.context
          : existingMeasurement.context,
      measuredAt:
        result.data.measuredAt ?? existingMeasurement.measuredAt,
      notes:
        result.data.notes !== undefined
          ? result.data.notes
          : existingMeasurement.notes,
    });

    if (!mergedState.success) {
      return NextResponse.json(
        {
          error: "Update would create an invalid health measurement",
          details: mergedState.error.flatten(),
        },
        { status: 400 },
      );
    }

    const measurement = await prisma.healthMeasurement.update({
      where: {
        id: measurementId,
      },
      data: result.data,
    });

    return NextResponse.json({ measurement });
  } catch (error) {
    console.error("Failed to update health measurement:", error);

    return NextResponse.json(
      { error: "Failed to update health measurement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { measurementId } = await params;

    const existingMeasurement =
      await prisma.healthMeasurement.findFirst({
        where: {
          id: measurementId,
          userId: session.user.id,
        },
      });

    if (!existingMeasurement) {
      return NextResponse.json(
        { error: "Health measurement not found" },
        { status: 404 }
      );
    }

    await prisma.healthMeasurement.delete({
      where: {
        id: measurementId,
      },
    });

    return NextResponse.json({
      message: "Health measurement deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete health measurement:", error);

    return NextResponse.json(
      { error: "Failed to delete health measurement" },
      { status: 500 }
    );
  }
}