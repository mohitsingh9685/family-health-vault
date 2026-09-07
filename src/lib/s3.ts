// src/lib/s3.ts
// Relation: Server-side API routes → this utility → AWS S3.
// Used by:
//   - /api/medical-records/upload
//   - /api/medical-records/upload/complete
//
// IMPORTANT:
// This file must remain server-only because it uses AWS credentials.

import {
   GetObjectCommand,
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
// Read uploaded object metadata
// -----------------------------------------------------------------------------
// Relation:
// Browser → S3 upload
//       ↓
// /api/medical-records/upload/complete
//       ↓
// getObjectMetadata()
//       ↓
// AWS S3
//
// Existence alone is insufficient: the completion route must compare S3's
// actual content length and type with the metadata validated before upload.
export async function getObjectMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);

    return {
      contentLength: response.ContentLength ?? null,
      contentType: response.ContentType ?? null,
    };
  } catch (error) {
    // AWS SDK exposes the HTTP status through $metadata.
    const statusCode = (
      error as {
        $metadata?: {
          httpStatusCode?: number;
        };
      }
    ).$metadata?.httpStatusCode;

    if (statusCode === 404) {
      return null;
    }

    // Permission and service failures must remain visible to the API instead
    // of being incorrectly reported as a missing upload.
    throw error;
  }
}

// Relation: Download API → this utility → AWS S3.
// Generates a short-lived URL for viewing/downloading a private medical file.
export async function createDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 300,
  });
}

/**
 * Verify the file signature from a small S3 range request. This prevents HTML
 * or arbitrary bytes being accepted merely because the client claimed an
 * allowed Content-Type. This is format validation, not malware scanning.
 */
export async function verifyObjectContentSignature(
  key: string,
  contentType: string,
) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      Range: "bytes=0-1023",
    }),
  );

  if (!response.Body) {
    return false;
  }

  const bytes = await response.Body.transformToByteArray();

  if (contentType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (contentType === "image/png") {
    const pngSignature = [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ];

    return pngSignature.every((value, index) => bytes[index] === value);
  }

  if (contentType === "application/pdf") {
    const pdfSignature = [0x25, 0x50, 0x44, 0x46, 0x2d];

    // ISO 32000 readers commonly permit the header within the first 1024
    // bytes, so search that bounded prefix without downloading the document.
    return bytes.some((_, start) =>
      pdfSignature.every(
        (value, offset) => bytes[start + offset] === value,
      ),
    );
  }

  return false;
}
