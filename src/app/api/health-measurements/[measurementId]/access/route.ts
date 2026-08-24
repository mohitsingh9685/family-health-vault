import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createHealthMeasurementAccessSchema } from "@/lib/validation/health-measurement";

type RouteContext = {
  params: Promise<{ measurementId: string }>;
};

export async function POST(
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

    const result = createHealthMeasurementAccessSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { familyId } = result.data;

    // The authenticated user must own the measurement.
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

    // The owner only needs to belong to the target family.
    const membership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: session.user.id,
          familyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 }
      );
    }

    const existingAccess =
      await prisma.healthMeasurementAccess.findUnique({
        where: {
          measurementId_familyId: {
            measurementId,
            familyId,
          },
        },
      });

    if (existingAccess) {
      return NextResponse.json(
        { error: "This family already has access to the measurement" },
        { status: 409 }
      );
    }

    const access = await prisma.healthMeasurementAccess.create({
      data: {
        measurementId,
        familyId,
        accessLevel: "VIEWER",
      },
    });

    return NextResponse.json(
      { access },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to share health measurement:", error);

    return NextResponse.json(
      { error: "Failed to share health measurement" },
      { status: 500 }
    );
  }
}

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

    const accesses = await prisma.healthMeasurementAccess.findMany({
      where: {
        measurementId,
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ accesses });
  } catch (error) {
    console.error(
      "Failed to fetch health measurement access:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch health measurement access" },
      { status: 500 }
    );
  }
}