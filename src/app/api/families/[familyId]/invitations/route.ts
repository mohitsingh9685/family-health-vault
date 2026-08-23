import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyOwner,
} from "@/lib/auth/authorization";

type InvitationRouteContext = {
  params: Promise<{
    familyId: string;
  }>;
};

// [Auth.js → Invitation API]
// Only authenticated family owners can generate invitations.
export async function POST(
  _request: Request,
  { params }: InvitationRouteContext
) {
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
    // Only the family OWNER can generate invitation codes.
    await requireFamilyOwner(session.user.id, familyId);

    // [Security → Invitation Code]
    // Generate a cryptographically secure random code.
    // The raw code is returned once and never stored.
    const code = randomBytes(6)
      .toString("hex")
      .toUpperCase();

    // [Security → Database]
    // Store only the SHA-256 hash of the invitation code.
    const tokenHash = createHash("sha256")
      .update(code)
      .digest("hex");

    // [Invitation → Expiration]
    // Invitation codes remain valid for 7 days.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // [Prisma → FamilyInvitation]
    // Store the hashed invitation and its metadata.
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
    // Return the raw code only after successful creation.
    return NextResponse.json(
      {
        invitation,
        code,
      },
      { status: 201 }
    );
  } catch (error) {
    // [Authorization → Invitation API]
    // Convert ownership failures into a safe response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [Invitation API → Error Handling]
    // Never expose internal database/security details.
    console.error("Failed to create invitation:", error);

    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// [Auth.js → Invitation API]
// Only the family OWNER can revoke an unused invitation.
export async function DELETE(
  request: Request,
  { params }: InvitationRouteContext
) {
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
    // Only the OWNER can revoke invitations.
    await requireFamilyOwner(session.user.id, familyId);

    // [Client → Invitation API]
    // The invitation ID comes from an untrusted client.
    const body = await request.json();

    if (
      !body ||
      typeof body.invitationId !== "string" ||
      !body.invitationId.trim()
    ) {
      return NextResponse.json(
        { error: "Invalid invitation ID" },
        { status: 400 }
      );
    }

    // [Prisma → FamilyInvitation]
    // Delete only an unused invitation belonging to this family.
    const result = await prisma.familyInvitation.deleteMany({
      where: {
        id: body.invitationId.trim(),
        familyId,
        acceptedAt: null,
      },
    });

    // [Invitation API → Validation]
    // No matching unused invitation means it was already used,
    // expired/removed, or does not belong to this family.
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Invitation not found or already used" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Invitation revoked successfully",
    });
  } catch (error) {
    // [Authorization → Invitation API]
    // Convert authorization failures into a safe response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [Invitation API → Error Handling]
    // Keep internal database errors on the server.
    console.error("Failed to revoke invitation:", error);

    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}