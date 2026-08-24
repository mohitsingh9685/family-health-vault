// src/lib/s3.ts
// Relation: Server-side API routes → this utility → AWS S3.
// Used by:
//   - /api/medical-records/upload
//   - /api/medical-records/upload/complete
//
// IMPORTANT:
// This file must remain server-only because it uses AWS credentials.

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// -----------------------------------------------------------------------------
// Server-only AWS configuration
// -----------------------------------------------------------------------------
// These values come from .env and must NEVER use NEXT_PUBLIC_*.
// They must never be exposed to browser/client components.
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

// Fail early if the required AWS configuration is missing.
// This prevents unclear AWS errors later during API execution.
if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error("Missing required AWS S3 environment variables");
}

// -----------------------------------------------------------------------------
// S3 client
// -----------------------------------------------------------------------------
// Relation: API routes → S3 client → AWS S3.
// This client is created only on the server.
export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// -----------------------------------------------------------------------------
// Create presigned upload URL
// -----------------------------------------------------------------------------
// Relation: Upload API → createUploadUrl() → Browser → S3.
//
// The browser receives only the temporary presigned URL.
// It never receives AWS credentials.
export async function createUploadUrl(
  key: string,
  contentType: string,
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // The URL is valid for only 5 minutes.
  // Short expiration reduces the impact of URL leakage.
  return getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });
}

// -----------------------------------------------------------------------------
// Verify uploaded object
// -----------------------------------------------------------------------------
// Relation:
// Browser → S3 upload
//       ↓
// /api/medical-records/upload/complete
//       ↓
// verifyObjectExists()
//       ↓
// AWS S3
//
// The server verifies that the expected object actually exists before
// changing MedicalRecord.uploadStatus from PENDING to UPLOADED.
export async function verifyObjectExists(key: string) {
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await s3Client.send(command);

    // S3 successfully found the object.
    return true;
  } catch (error) {
    // AWS SDK exposes the HTTP status through $metadata.
    const statusCode = (
      error as {
        $metadata?: {
          httpStatusCode?: number;
        };
      }
    ).$metadata?.httpStatusCode;

    // Object does not exist.
    // Return false instead of treating this as a server failure.
    if (statusCode === 404) {
      return false;
    }

    // Any unexpected AWS error should propagate to the API route
    // so it can be handled and logged appropriately.
    throw error;
  }
}