import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDownloadUrl } from "@/lib/s3";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      recordId: string;
    }>;
  },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { recordId } = await params;

    // [Authorization → Medical Record]
    // User can view their own record or a record shared with
    // one of their families.
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        uploadStatus: "UPLOADED",
        OR: [
          {
            userId: session.user.id,
          },
          {
            accesses: {
              some: {
                family: {
                  members: {
                    some: {
                      userId: session.user.id,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        storageKey: true,
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 },
      );
    }

    if (!record.storageKey) {
      return NextResponse.json(
        { error: "Medical file is not available" },
        { status: 404 },
      );
    }

    // [API → S3]
    // Generate a temporary URL without exposing AWS credentials.
    // [API → S3]
// Generate a temporary URL without exposing AWS credentials.
const viewUrl = await createDownloadUrl(record.storageKey);

// Redirect browser directly to S3 PDF URL.
// Browser will open PDF instead of displaying JSON.
return NextResponse.redirect(viewUrl);
  } catch (error) {
    console.error("Failed to create medical record view URL:", error);

    return NextResponse.json(
      { error: "Failed to open medical record" },
      { status: 500 },
    );
  }
}