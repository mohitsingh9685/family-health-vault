import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createMedicalRecordSchema } from "@/lib/validation/medical-record";

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
    const result = createMedicalRecordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        userId: session.user.id,
        title: result.data.title,
        type: result.data.type,
        description: result.data.description,
      },
    });

    return NextResponse.json(
      { medicalRecord },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create medical record:", error);

    return NextResponse.json(
      { error: "Failed to create medical record" },
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

    const medicalRecords = await prisma.medicalRecord.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ medicalRecords });
  } catch (error) {
    console.error("Failed to fetch medical records:", error);

    return NextResponse.json(
      { error: "Failed to fetch medical records" },
      { status: 500 }
    );
  }
}