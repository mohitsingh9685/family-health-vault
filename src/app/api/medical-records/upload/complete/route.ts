// Relation: Frontend → Upload Complete API → S3 → PostgreSQL.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  requireFamilyMember,
  AuthorizationError,
} from "@/lib/auth/authorization";
import {
  getObjectMetadata,
  verifyObjectContentSignature,
} from "@/lib/s3";
import { z } from "zod";

const completeUploadSchema = z.object({
  medicalRecordId: z.string().uuid(),
  familyId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    // Auth.js → API: only authenticated users can complete uploads.
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = completeUploadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { medicalRecordId, familyId } = result.data;

    // API → authorization.ts: verify family membership.
    try {
      await requireFamilyMember(session.user.id, familyId);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }

      throw error;
    }

    // Prisma: only the record owner can complete their upload.
    const medicalRecord = await prisma.medicalRecord.findFirst({
      where: {
        id: medicalRecordId,
        userId: session.user.id,
        uploadStatus: "PENDING",
        accesses: {
          some: {
            familyId,
          },
        },
      },
    });

    if (!medicalRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 },
      );
    }

    if (!medicalRecord.storageKey) {
      return NextResponse.json(
        { error: "Medical record has no storage key" },
        { status: 500 },
      );
    }

    // API → s3.ts → S3: verify the uploaded object's trusted metadata.
    const objectMetadata = await getObjectMetadata(
      medicalRecord.storageKey,
    );

    if (!objectMetadata) {
      return NextResponse.json(
        { error: "Uploaded file was not found in storage" },
        { status: 409 },
      );
    }

    if (
      medicalRecord.fileSize === null ||
      medicalRecord.mimeType === null
    ) {
      return NextResponse.json(
        { error: "Medical record is missing expected file metadata" },
        { status: 500 },
      );
    }

    if (
      objectMetadata.contentLength !== medicalRecord.fileSize ||
      objectMetadata.contentType !== medicalRecord.mimeType
    ) {
      return NextResponse.json(
        {
          error:
            "Uploaded file size or type does not match the approved upload",
        },
        { status: 409 },
      );
    }

    const hasValidSignature = await verifyObjectContentSignature(
      medicalRecord.storageKey,
      medicalRecord.mimeType,
    );

    if (!hasValidSignature) {
      return NextResponse.json(
        { error: "Uploaded file content does not match its declared type" },
        { status: 409 },
      );
    }

    // S3 metadata and content signature verified → mark as uploaded.
    const updatedRecord = await prisma.medicalRecord.update({
      where: {
        id: medicalRecord.id,
      },
      data: {
        uploadStatus: "UPLOADED",
      },
    });

    return NextResponse.json(
      { medicalRecord: updatedRecord },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Failed to complete medical record upload:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to complete upload" },
      { status: 500 },
    );
  }
}