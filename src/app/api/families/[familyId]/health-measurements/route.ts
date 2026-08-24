import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyMember,
} from "@/lib/auth/authorization";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      familyId: string;
    }>;
  }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId } = await params;

  try {
    // [Authorization → Family Health Measurements]
    // The authenticated user must belong to the requested family.
    await requireFamilyMember(session.user.id, familyId);

    // [Family Access → Health Measurements]
    // Return only measurements explicitly shared with this family.
    const measurements = await prisma.healthMeasurement.findMany({
      where: {
        accesses: {
          some: {
            familyId,
          },
        },
      },
      select: {
        id: true,
        type: true,
        value: true,
        unit: true,
        systolic: true,
        diastolic: true,
        context: true,
        measuredAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        measuredAt: "desc",
      },
    });

    return NextResponse.json({
      measurements,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    console.error(
      "Failed to fetch family health measurements:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch family health measurements" },
      { status: 500 }
    );
  }
}