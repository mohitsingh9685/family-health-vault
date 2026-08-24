import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    measurementId: string;
    familyId: string;
  }>;
};

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

    const { measurementId, familyId } = await params;

    const measurement = await prisma.healthMeasurement.findFirst({
      where: {
        id: measurementId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: "Health measurement not found" },
        { status: 404 }
      );
    }

    const access = await prisma.healthMeasurementAccess.findUnique({
      where: {
        measurementId_familyId: {
          measurementId,
          familyId,
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Family does not have access to this measurement" },
        { status: 404 }
      );
    }

    await prisma.healthMeasurementAccess.delete({
      where: {
        measurementId_familyId: {
          measurementId,
          familyId,
        },
      },
    });

    return NextResponse.json({
      message: "Family access revoked successfully",
    });
  } catch (error) {
    console.error(
      "Failed to revoke health measurement access:",
      error
    );

    return NextResponse.json(
      { error: "Failed to revoke health measurement access" },
      { status: 500 }
    );
  }
}