// Relation: Frontend → this API → S3.
// This route authenticates the user, verifies family membership,
// validates upload metadata, creates the medical-record metadata,
// and returns a short-lived S3 presigned URL.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  requireFamilyMember,
  AuthorizationError,
} from "@/lib/auth/authorization";
import { createUploadUrl } from "@/lib/s3";
import { createMedicalRecordSchema } from "@/lib/validation/medical-record";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export async function POST(request: Request) {
  try {
    // [Auth.js → Upload API]
    // Only authenticated users can request an upload URL.
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // [Client → Upload API]
    // Request body contains metadata only, never the actual file.
    const body = await request.json();

    const {
      familyId,
      fileName,
      contentType,
      fileSize,
      ...medicalRecordData
    } = body;

    // [Upload API → Medical Record Validation]
    // Validate title/type/description using the existing schema.
    const medicalRecordResult =
      createMedicalRecordSchema.safeParse(medicalRecordData);

    if (!medicalRecordResult.success) {
      return NextResponse.json(
        {
          error: "Invalid medical record data",
          details: medicalRecordResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // [Upload API → Authorization]
    // The authenticated user must belong to the requested family.
    try {
      await requireFamilyMember(session.user.id, familyId);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      throw error;
    }

    // [Upload API → File Validation]
    // Validate basic file metadata before creating an S3 URL.
    if (
      typeof fileName !== "string" ||
      fileName.trim().length === 0 ||
      fileName.length > 255
    ) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 }
      );
    }

    if (
      typeof contentType !== "string" ||
      !ALLOWED_MIME_TYPES.has(contentType)
    ) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    if (
      typeof fileSize !== "number" ||
      !Number.isInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { error: "File size must be between 1 byte and 10 MB" },
        { status: 400 }
      );
    }

    // [Upload API → S3]
    // Generate a server-controlled object key.
    // Never trust the client to choose the S3 path.
    const medicalRecordId = crypto.randomUUID();

    const storageKey =
      `medical/${familyId}/${session.user.id}/${medicalRecordId}`;

    // [Upload API → Prisma]
    // Create the database record before returning the upload URL.
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        id: medicalRecordId,
        userId: session.user.id,
        title: medicalRecordResult.data.title,
        type: medicalRecordResult.data.type,
        description: medicalRecordResult.data.description,
        storageKey,
        fileName: fileName.trim(),
        mimeType: contentType,
        fileSize,
      },
    });

    // [Upload API → S3 Utility]
    // Generate a short-lived URL for direct browser-to-S3 upload.
    const uploadUrl = await createUploadUrl(
      storageKey,
      contentType
    );

    // [Upload API → Frontend]
    return NextResponse.json(
      {
        medicalRecordId: medicalRecord.id,
        uploadUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    // [Upload API → Error Handling]
    // Never expose internal AWS/database errors to the client.
    console.error("Failed to prepare medical record upload:", error);

    return NextResponse.json(
      { error: "Failed to prepare medical record upload" },
      { status: 500 }
    );
  }
}