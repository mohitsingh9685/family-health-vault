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
    // [Authorization → Family Medical Records]
    // The authenticated user must belong to the requested family.
    await requireFamilyMember(session.user.id, familyId);

    // [Family Access → Medical Records]
    // Return only records explicitly shared with this family.
    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        uploadStatus: "UPLOADED",
        accesses: {
          some: {
            familyId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        processingStatus: true,
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
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      medicalRecords,
    });
  } catch (error) {
    // [Authorization → API]
    // Convert authorization failures into a safe response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    console.error(
      "Failed to fetch family medical records:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch family medical records" },
      { status: 500 }
    );
  }
}