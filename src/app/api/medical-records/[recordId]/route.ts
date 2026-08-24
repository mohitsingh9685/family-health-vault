import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateMedicalRecordSchema } from "@/lib/validation/medical-record";

type RouteContext = {
  params: Promise<{ recordId: string }>;
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

    const { recordId } = await params;

    const medicalRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id,
      },
    });

    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ medicalRecord });
  } catch (error) {
    console.error("Failed to fetch medical record:", error);

    return NextResponse.json(
      { error: "Failed to fetch medical record" },
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

    const { recordId } = await params;
    const body = await request.json();

    const result = updateMedicalRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    const medicalRecord = await prisma.medicalRecord.update({
      where: {
        id: recordId,
      },
      data: result.data,
    });

    return NextResponse.json({ medicalRecord });
  } catch (error) {
    console.error("Failed to update medical record:", error);

    return NextResponse.json(
      { error: "Failed to update medical record" },
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

    const { recordId } = await params;

    const existingRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        userId: session.user.id,
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    await prisma.medicalRecord.delete({
      where: {
        id: recordId,
      },
    });

    return NextResponse.json(
      { message: "Medical record deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete medical record:", error);

    return NextResponse.json(
      { error: "Failed to delete medical record" },
      { status: 500 }
    );
  }
}