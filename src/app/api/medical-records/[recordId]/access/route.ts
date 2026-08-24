import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createMedicalRecordAccessSchema } from "@/lib/validation/medical-record";

type RouteContext = {
  params: Promise<{ recordId: string }>;
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

    const { recordId } = await params;
    const body = await request.json();

    const result = createMedicalRecordAccessSchema.safeParse(body);

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

    // The authenticated user must own the medical record.
    const medicalRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // The record owner only needs to be a member of the target family.
    const familyMembership = await prisma.familyMember.findUnique({
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

    if (!familyMembership) {
      return NextResponse.json(
        { error: "You are not a member of this family" },
        { status: 403 }
      );
    }

    // Prevent the same family from receiving duplicate access.
    const existingAccess =
      await prisma.medicalRecordAccess.findUnique({
        where: {
          medicalRecordId_familyId: {
            medicalRecordId: recordId,
            familyId,
          },
        },
      });

    if (existingAccess) {
      return NextResponse.json(
        { error: "This family already has access to the record" },
        { status: 409 }
      );
    }

    const access = await prisma.medicalRecordAccess.create({
      data: {
        medicalRecordId: recordId,
        familyId,
        accessLevel: "VIEWER",
      },
    });

    return NextResponse.json(
      { access },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to share medical record:", error);

    return NextResponse.json(
      { error: "Failed to share medical record" },
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

    const { recordId } = await params;

    // Only the record owner can manage its family access.
    const medicalRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    const accesses = await prisma.medicalRecordAccess.findMany({
      where: {
        medicalRecordId: recordId,
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
    console.error("Failed to fetch medical record access:", error);

    return NextResponse.json(
      { error: "Failed to fetch medical record access" },
      { status: 500 }
    );
  }
}
