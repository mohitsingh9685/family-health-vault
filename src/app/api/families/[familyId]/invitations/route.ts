import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyOwner,
} from "@/lib/auth/authorization";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  // [Auth.js → Invitation API]
  // Only authenticated users can create family invitations.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId } = await params;

  try {
    // [Authorization → Invitation API]
    // Only the owner of this family can generate invitation codes.
    await requireFamilyOwner(session.user.id, familyId);

    // [Security → Invitation Code]
    // Generate a cryptographically secure random value.
    // The raw code is shown once to the owner; only its hash is stored.
    const code = randomBytes(6)
      .toString("hex")
      .toUpperCase();

    // [Security → Database]
    // Store only the SHA-256 hash, never the usable invitation code.
    const tokenHash = createHash("sha256")
      .update(code)
      .digest("hex");

    // [Invitation → Expiration]
    // Invitation codes are valid for 7 days.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // [Prisma → FamilyInvitation]
    // Store the hashed code and invitation metadata.
    const invitation = await prisma.familyInvitation.create({
      data: {
        familyId,
        invitedByUserId: session.user.id,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // [Invitation API → Family Owner UI]
    // Return the raw code only when it is generated.
    // It is never stored in the database.
    return NextResponse.json(
      {
        invitation,
        code,
      },
      { status: 201 }
    );
  } catch (error) {
    // [Authorization → Invitation API]
    // Convert ownership failures into a safe 403 response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [Invitation API → Error Handling]
    // Never expose internal database/security details to the client.
    console.error("Failed to create invitation:", error);

    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}