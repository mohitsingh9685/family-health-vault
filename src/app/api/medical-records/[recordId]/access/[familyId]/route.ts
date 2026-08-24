import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    recordId: string;
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

    const { recordId, familyId } = await params;

    // Only the record owner can revoke family access.
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

    const access = await prisma.medicalRecordAccess.findUnique({
      where: {
        medicalRecordId_familyId: {
          medicalRecordId: recordId,
          familyId,
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Family does not have access to this record" },
        { status: 404 }
      );
    }

    await prisma.medicalRecordAccess.delete({
      where: {
        medicalRecordId_familyId: {
          medicalRecordId: recordId,
          familyId,
        },
      },
    });

    return NextResponse.json({
      message: "Family access revoked successfully",
    });
  } catch (error) {
    console.error("Failed to revoke medical record access:", error);

    return NextResponse.json(
      { error: "Failed to revoke medical record access" },
      { status: 500 }
    );
  }
}