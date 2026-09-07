import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createDownloadUrl,
  getObjectMetadata,
  verifyObjectContentSignature,
} from "@/lib/s3";

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
        fileSize: true,
        mimeType: true,
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

    if (record.fileSize === null || record.mimeType === null) {
      return NextResponse.json(
        { error: "Medical file metadata is incomplete" },
        { status: 409 },
      );
    }

    const objectMetadata = await getObjectMetadata(record.storageKey);

    if (
      !objectMetadata ||
      objectMetadata.contentLength !== record.fileSize ||
      objectMetadata.contentType !== record.mimeType
    ) {
      return NextResponse.json(
        { error: "Medical file failed its storage integrity check" },
        { status: 409 },
      );
    }

    const hasValidSignature = await verifyObjectContentSignature(
      record.storageKey,
      record.mimeType,
    );

    if (!hasValidSignature) {
      return NextResponse.json(
        { error: "Medical file failed its content integrity check" },
        { status: 409 },
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